const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const { getEnv } = require("../services/env");
const { detectMetaType } = require("../services/detectService");
const { registerActions, summarizeUser, getMetas } = require("../services/metaService");
const { getRanking } = require("../services/dataService");
const { backupActive, rotateMonth, ensureRotationIfNeeded } = require("../services/backupService");
const { META_TYPES } = require("../services/metaTypes");

const env = getEnv();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

async function resolveTargets(message) {
  const targets = [];
  const mentionedUsers = [...message.mentions.users.values()];
  if (mentionedUsers.length === 0) return targets;

  for (const user of mentionedUsers) {
    try {
      const member = await message.guild.members.fetch({ user: user.id, force: false });
      const staffRoleId = env.STAFF_ROLES_METAS.find((roleId) => member.roles.cache.has(roleId));
      if (!staffRoleId) continue;
      const roleName = member.roles.cache.get(staffRoleId)?.name || "";
      targets.push({ id: user.id, roleName, observacao: `menção em ${message.channel.name}` });
    } catch (error) {
      continue;
    }
  }

  return targets;
}

async function resolveAuthorTarget(message) {
  try {
    const member = await message.guild.members.fetch({ user: message.author.id, force: false });
    const staffRoleId = env.STAFF_ROLES_METAS.find((roleId) => member.roles.cache.has(roleId));
    if (!staffRoleId) return null;
    const roleName = member.roles.cache.get(staffRoleId)?.name || "";
    return { id: message.author.id, roleName, observacao: `mensagem em ${message.channel.name}` };
  } catch (error) {
    return null;
  }
}

function matchesKeywords(content, keywords) {
  if (!keywords || keywords.length === 0) return false;
  return keywords.some((keyword) => content.includes(keyword));
}

async function handleMentionRule({ message, tipo, allowedChannels, keywords, requiresKeyword, allowBots }) {
  if (!allowedChannels.includes(message.channel.id)) return false;
  if (!allowBots && message.author.bot) return false;
  if (requiresKeyword && !matchesKeywords(message.content || "", keywords)) return false;
  if (message.mentions.users.size === 0) return false;

  const targets = await resolveTargets(message);
  if (!targets.length) return false;

  await registerActions({
    messageId: message.id,
    channelId: message.channel.id,
    authorId: message.author.id,
    targets,
    tipo
  });

  return true;
}

async function handlePerMessageRule({ message, tipo, channelId, keywords, requiresKeyword, allowBots }) {
  if (channelId !== message.channel.id) return false;
  if (!allowBots && message.author.bot) return false;
  if (requiresKeyword && !matchesKeywords(message.content || "", keywords)) return false;

  const target = await resolveAuthorTarget(message);
  if (!target) return false;

  await registerActions({
    messageId: message.id,
    channelId: message.channel.id,
    authorId: message.author.id,
    targets: [target],
    tipo
  });

  return true;
}

function getPrimaryStaffRole(member) {
  return env.STAFF_ROLES_METAS.find((roleId) => member.roles.cache.has(roleId));
}

async function syncStaffToApi(payload) {
  if (!env.STAFF_SYNC_URL || !env.INTERNAL_BOT_KEY) return;
  try {
    await fetch(env.STAFF_SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": env.INTERNAL_BOT_KEY
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Falha ao sincronizar staff:", error);
  }
}

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const staffRoleId = getPrimaryStaffRole(newMember);
    const hasStaffRole = Boolean(staffRoleId);

    if (!hasStaffRole) {
      await syncStaffToApi({
        acao: "remove",
        discordId: newMember.id
      });
      return;
    }

    const roleName = newMember.roles.cache.get(staffRoleId)?.name || "";
    const avatarUrl = newMember.user?.displayAvatarURL({ extension: "png", size: 128 }) || "";
    await syncStaffToApi({
      acao: "upsert",
      discordId: newMember.id,
      nome: newMember.displayName,
      idServidor: newMember.displayName,
      roles: newMember.roles.cache.map((role) => role.id),
      cargoLabel: roleName,
      avatarUrl
    });
  } catch (error) {
    console.error("Erro no guildMemberUpdate:", error);
  }
});

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return;

    const handledRevisao = await handleMentionRule({
      message,
      tipo: META_TYPES.REVISAO,
      allowedChannels: env.CH_REVISAO_ALLOWED_CHANNELS,
      keywords: env.REVISAO_KEYWORDS,
      requiresKeyword: env.META_REVISAO_REQUIRES_KEYWORD,
      allowBots: env.META_REVISAO_COUNT_BOTS
    });
    if (handledRevisao) return;

    const handledDenuncia = await handleMentionRule({
      message,
      tipo: META_TYPES.DENUNCIA,
      allowedChannels: env.CH_DENUNCIA_ALLOWED_CHANNELS,
      keywords: env.DENUNCIA_KEYWORDS,
      requiresKeyword: env.META_DENUNCIA_REQUIRES_KEYWORD,
      allowBots: env.META_DENUNCIA_COUNT_BOTS
    });
    if (handledDenuncia) return;

    const handledBanHack = await handlePerMessageRule({
      message,
      tipo: META_TYPES.BAN_HACK,
      channelId: env.CH_BANHACK_CHANNEL_ID,
      keywords: env.BANHACK_KEYWORDS,
      requiresKeyword: env.META_BANHACK_REQUIRES_KEYWORD,
      allowBots: env.META_BANHACK_COUNT_BOTS
    });
    if (handledBanHack) return;

    if (message.author.bot) return;

    const { tipo } = await detectMetaType({
      channelId: message.channel.id,
      content: message.content || ""
    });

    if (!tipo) return;

    if (message.mentions.users.size === 0) return;

    const targets = await resolveTargets(message);
    if (targets.length === 0) return;

    await registerActions({
      messageId: message.id,
      channelId: message.channel.id,
      authorId: message.author.id,
      targets,
      tipo
    });
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "meta") {
      const user = interaction.options.getUser("usuario", true);
      const metas = await getMetas();
      const userData = metas[user.id];
      if (!userData) {
        await interaction.reply({ content: "Nenhuma meta registrada para este usuário.", ephemeral: true });
        return;
      }
      const resumo = summarizeUser(userData);
      const embed = new EmbedBuilder()
        .setTitle(`Metas de ${user.username}`)
        .setDescription(`Total: ${resumo.totalAcoes}`)
        .addFields(
          { name: "Ticket Aceito", value: String(resumo.porTipo.TICKET_ACEITO || 0), inline: true },
          { name: "Ticket Negado", value: String(resumo.porTipo.TICKET_NEGADO || 0), inline: true },
          { name: "Revisão", value: String(resumo.porTipo.REVISAO || 0), inline: true },
          { name: "Ban", value: String(resumo.porTipo.BAN || 0), inline: true },
          { name: "Denúncia", value: String(resumo.porTipo.DENUNCIA || 0), inline: true },
          { name: "Ban Hack", value: String(resumo.porTipo.BAN_HACK || 0), inline: true }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (interaction.commandName === "ranking") {
      const tipo = interaction.options.getString("tipo", false);
      const ranking = await getRanking({ tipo, cargo: null });
      const top = ranking.slice(0, 10);
      const lines = top.map((entry, index) => {
        const value = tipo ? (entry.counts[tipo] || 0) : entry.totalAcoes;
        return `#${index + 1} <@${entry.userId}> - ${value}`;
      });
      await interaction.reply({ content: lines.join("\n") || "Sem dados.", ephemeral: true });
      return;
    }

    if (interaction.commandName === "backup_agora") {
      const key = await backupActive();
      await interaction.reply({ content: `Backup criado: ${key}`, ephemeral: true });
      return;
    }

    if (interaction.commandName === "rotacionar_mes") {
      const key = await rotateMonth();
      await interaction.reply({ content: `Rotação concluída: ${key}`, ephemeral: true });
      return;
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Erro ao executar comando.", ephemeral: true });
  }
});

client.once("ready", async () => {
  console.log(`Bot online: ${client.user.tag}`);
  await ensureRotationIfNeeded();

  setInterval(async () => {
    try {
      await backupActive();
    } catch (error) {
      console.error("Backup falhou:", error);
    }
  }, 30 * 60 * 1000);

  setInterval(async () => {
    try {
      await ensureRotationIfNeeded();
    } catch (error) {
      console.error("Rotação falhou:", error);
    }
  }, 60 * 60 * 1000);
});

client.login(env.DISCORD_BOT_TOKEN);
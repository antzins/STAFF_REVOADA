const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { getEnv } = require("../services/env");

const env = getEnv();

const commands = [
  new SlashCommandBuilder()
    .setName("meta")
    .setDescription("Consultar metas de um usuário")
    .addUserOption((option) =>
      option.setName("usuario").setDescription("Usuário do Discord").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Ranking de metas")
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Tipo de meta")
        .addChoices(
          { name: "Ticket Aceito", value: "TICKET_ACEITO" },
          { name: "Ticket Negado", value: "TICKET_NEGADO" },
          { name: "Revisão", value: "REVISAO" },
          { name: "Ban", value: "BAN" },
          { name: "Denúncia", value: "DENUNCIA" },
          { name: "Ban Hack", value: "BAN_HACK" }
        )
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("backup_agora")
    .setDescription("Forçar backup das metas"),
  new SlashCommandBuilder()
    .setName("rotacionar_mes")
    .setDescription("Rotacionar mês e zerar metas")
];

async function register() {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);
  await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.GUILD_ID), {
    body: commands.map((command) => command.toJSON())
  });
  console.log("Slash commands registrados.");
}

register().catch((error) => {
  console.error(error);
  process.exit(1);
});
const { META_TYPES } = require("./metaTypes");
const { getEnv } = require("./env");
const { getConfig } = require("./configService");

function detectByChannel(channelId, env) {
  const revChannels = env.CH_REVISAO_ALLOWED_CHANNELS || [];
  if (revChannels.includes(channelId)) return META_TYPES.REVISAO;
  const denChannels = env.CH_DENUNCIA_ALLOWED_CHANNELS || [];
  if (denChannels.includes(channelId)) return META_TYPES.DENUNCIA;
  if (env.CH_BANHACK_CHANNEL_ID && channelId === env.CH_BANHACK_CHANNEL_ID) return META_TYPES.BAN_HACK;
  return null;
}

function normalizeText(text) {
  return text.toUpperCase();
}

function matchTag(text, tags) {
  const normalized = normalizeText(text);
  return tags.find((tag) => normalized.includes(tag.toUpperCase()));
}

async function detectMetaType({ channelId, content }) {
  const env = getEnv();
  const config = await getConfig();
  const byChannel = detectByChannel(channelId, env);

  if (byChannel && config.enabledMetaTypes[byChannel] !== false) {
    return { tipo: byChannel, origem: "canal" };
  }

  if (!config.metaFallbackEnabled) {
    return { tipo: null, origem: "nenhuma" };
  }

  for (const tipo of Object.values(META_TYPES)) {
    if (!config.enabledMetaTypes[tipo]) continue;
    const tags = config.fallbackTags[tipo] || [];
    if (matchTag(content || "", tags)) {
      return { tipo, origem: "fallback" };
    }
  }

  return { tipo: null, origem: "nenhuma" };
}

module.exports = { detectMetaType };

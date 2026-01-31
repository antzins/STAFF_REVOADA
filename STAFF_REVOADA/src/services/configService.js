const { META_TYPES } = require("./metaTypes");
const { getStorage } = require("../storage");
const { getEnv } = require("./env");

const CONFIG_KEY = "config.json";

function defaultConfig() {
  const env = getEnv();
  return {
    metaFallbackEnabled: env.META_FALLBACK_ENABLED,
    fallbackTags: {
      [META_TYPES.TICKET_ACEITO]: ["[TICKET ACEITO]"],
      [META_TYPES.TICKET_NEGADO]: ["[TICKET NEGADO]"],
      [META_TYPES.BAN]: ["[BAN]"],
      [META_TYPES.REVISAO]: ["[REVISAO]", "[REVISÃO]"],
      [META_TYPES.DENUNCIA]: [],
      [META_TYPES.BAN_HACK]: []
    },
    enabledMetaTypes: {
      [META_TYPES.TICKET_ACEITO]: true,
      [META_TYPES.TICKET_NEGADO]: true,
      [META_TYPES.BAN]: true,
      [META_TYPES.REVISAO]: true,
      [META_TYPES.DENUNCIA]: false,
      [META_TYPES.BAN_HACK]: false
    },
    updatedAt: Date.now(),
    version: 1
  };
}

function mergeConfig(base, incoming) {
  return {
    ...base,
    ...incoming,
    fallbackTags: {
      ...base.fallbackTags,
      ...(incoming.fallbackTags || {})
    },
    enabledMetaTypes: {
      ...base.enabledMetaTypes,
      ...(incoming.enabledMetaTypes || {})
    }
  };
}

function normalizeConfig(raw) {
  const fallback = defaultConfig();
  if (!raw || typeof raw !== "object") return fallback;

  const mapped = {
    metaFallbackEnabled:
      typeof raw.metaFallbackEnabled === "boolean"
        ? raw.metaFallbackEnabled
        : typeof raw.fallbackEnabled === "boolean"
          ? raw.fallbackEnabled
          : fallback.metaFallbackEnabled,
    fallbackTags: raw.fallbackTags || fallback.fallbackTags,
    enabledMetaTypes: raw.enabledMetaTypes || raw.enabledTypes || fallback.enabledMetaTypes,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : fallback.updatedAt,
    version: typeof raw.version === "number" ? raw.version : fallback.version
  };

  return mergeConfig(fallback, mapped);
}

async function getConfig() {
  const storage = getStorage();
  const current = await storage.readJson(CONFIG_KEY, null);
  return normalizeConfig(current);
}

function validateConfig(config) {
  if (typeof config.metaFallbackEnabled !== "boolean") {
    throw new Error("Configuração inválida: metaFallbackEnabled precisa ser booleano.");
  }

  if (!config.fallbackTags || typeof config.fallbackTags !== "object") {
    throw new Error("Configuração inválida: fallbackTags ausente.");
  }

  if (!config.enabledMetaTypes || typeof config.enabledMetaTypes !== "object") {
    throw new Error("Configuração inválida: enabledMetaTypes ausente.");
  }

  for (const type of Object.values(META_TYPES)) {
    const tags = config.fallbackTags[type];
    if (!Array.isArray(tags)) {
      throw new Error(`Configuração inválida: fallbackTags para ${type} precisa ser lista.`);
    }
    if (config.metaFallbackEnabled && config.enabledMetaTypes[type] && tags.length === 0) {
      throw new Error(`Configuração inválida: lista de tags vazia para ${type}.`);
    }
  }
}

async function saveConfig(config) {
  const storage = getStorage();
  const current = await getConfig();
  const merged = mergeConfig(current, config);
  validateConfig(merged);
  const updated = {
    ...merged,
    updatedAt: Date.now(),
    version: (current.version || 0) + 1
  };
  await storage.writeJson(CONFIG_KEY, updated);
  return updated;
}

module.exports = { getConfig, saveConfig, defaultConfig, normalizeConfig };
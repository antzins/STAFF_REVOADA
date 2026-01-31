const REQUIRED = [
  "SESSION_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "DISCORD_BOT_TOKEN",
  "GUILD_ID",
  "STAFF_ALLOWED_ROLES",
  "STAFF_ROLES_METAS",
  "INTERNAL_BOT_KEY",
  "STORAGE_MODE",
  "BLOB_READ_WRITE_TOKEN"
];

function requireEnv(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return String(value).trim();
}

function sanitizeOAuthEnv(name) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") {
    throw new Error(`${name} ausente ou inválido`);
  }
  const v = String(raw).trim().replace(/\s+/g, "");
  if (!v) {
    throw new Error(`${name} ausente ou inválido`);
  }
  return v;
}

function requirePresent(keys) {
  const missing = keys.filter((key) => !(key in process.env));
  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não definidas: ${missing.join(", ")}. ` +
      "Configure-as no painel do Vercel (Settings → Environment Variables) ou no arquivo .env."
    );
  }
}

const parseIdList = (value) =>
  (value || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

function parseCsv(value) {
  return parseIdList(value);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function getEnv() {
  requirePresent(REQUIRED);

  return {
    SESSION_SECRET: requireEnv("SESSION_SECRET"),
    DISCORD_BOT_TOKEN: requireEnv("DISCORD_BOT_TOKEN"),
    GUILD_ID: requireEnv("GUILD_ID"),
    DISCORD_CLIENT_ID: sanitizeOAuthEnv("DISCORD_CLIENT_ID"),
    DISCORD_CLIENT_SECRET: sanitizeOAuthEnv("DISCORD_CLIENT_SECRET"),
    DISCORD_REDIRECT_URI: sanitizeOAuthEnv("DISCORD_REDIRECT_URI"),
    META_FALLBACK_ENABLED: parseBoolean(process.env.META_FALLBACK_ENABLED, false),
    STAFF_ROLES_METAS: parseIdList(process.env.STAFF_ROLES_METAS),
    STAFF_ALLOWED_ROLES: parseIdList(process.env.STAFF_ALLOWED_ROLES),
    CH_REVISAO_ALLOWED_CHANNELS: parseIdList(process.env.CH_REVISAO_ALLOWED_CHANNELS),
    REVISAO_KEYWORDS: parseCsv(process.env.REVISAO_KEYWORDS),
    META_REVISAO_REQUIRES_KEYWORD: parseBoolean(process.env.META_REVISAO_REQUIRES_KEYWORD, false),
    META_REVISAO_COUNT_BOTS: parseBoolean(process.env.META_REVISAO_COUNT_BOTS, false),
    CH_DENUNCIA_ALLOWED_CHANNELS: parseIdList(process.env.CH_DENUNCIA_ALLOWED_CHANNELS),
    DENUNCIA_KEYWORDS: parseCsv(process.env.DENUNCIA_KEYWORDS),
    META_DENUNCIA_REQUIRES_KEYWORD: parseBoolean(process.env.META_DENUNCIA_REQUIRES_KEYWORD, false),
    META_DENUNCIA_COUNT_BOTS: parseBoolean(process.env.META_DENUNCIA_COUNT_BOTS, false),
    CH_BANHACK_CHANNEL_ID: process.env.CH_BANHACK_CHANNEL_ID || "",
    BANHACK_KEYWORDS: parseCsv(process.env.BANHACK_KEYWORDS),
    META_BANHACK_REQUIRES_KEYWORD: parseBoolean(process.env.META_BANHACK_REQUIRES_KEYWORD, false),
    META_BANHACK_COUNT_BOTS: parseBoolean(process.env.META_BANHACK_COUNT_BOTS, false),
    STAFF_SYNC_URL: process.env.STAFF_SYNC_URL || "",
    STORAGE_MODE: process.env.STORAGE_MODE || "local",
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || "",
    INTERNAL_BOT_KEY: process.env.INTERNAL_BOT_KEY || "",
    NODE_ENV: process.env.NODE_ENV || "development"
  };
}

module.exports = { getEnv, parseCsv, parseBoolean, parseIdList };

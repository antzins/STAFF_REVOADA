const REQUIRED = [
  "DISCORD_BOT_TOKEN",
  "GUILD_ID",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "SESSION_SECRET",
  "ADMIN_API_KEY",
  "CH_TICKETS_ACEITOS_ID",
  "CH_TICKETS_NEGADOS_ID",
  "CH_REVISAO_ID",
  "CH_BANS_ID"
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function parseCsv(value) {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function getEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  return {
    DISCORD_BOT_TOKEN: requireEnv("DISCORD_BOT_TOKEN"),
    GUILD_ID: requireEnv("GUILD_ID"),
    DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
    DISCORD_CLIENT_SECRET: requireEnv("DISCORD_CLIENT_SECRET"),
    DISCORD_REDIRECT_URI: requireEnv("DISCORD_REDIRECT_URI"),
    SESSION_SECRET: requireEnv("SESSION_SECRET"),
    ADMIN_API_KEY: requireEnv("ADMIN_API_KEY"),
    CH_TICKETS_ACEITOS_ID: requireEnv("CH_TICKETS_ACEITOS_ID"),
    CH_TICKETS_NEGADOS_ID: requireEnv("CH_TICKETS_NEGADOS_ID"),
    CH_REVISAO_ID: requireEnv("CH_REVISAO_ID"),
    CH_BANS_ID: requireEnv("CH_BANS_ID"),
    META_FALLBACK_ENABLED: parseBoolean(process.env.META_FALLBACK_ENABLED, false),
    STAFF_ROLES_METAS: parseCsv(process.env.STAFF_ROLES_METAS),
    STAFF_ALLOWED_ROLES: parseCsv(process.env.STAFF_ALLOWED_ROLES),
    CH_REVISAO_ALLOWED_CHANNELS: parseCsv(process.env.CH_REVISAO_ALLOWED_CHANNELS),
    REVISAO_KEYWORDS: parseCsv(process.env.REVISAO_KEYWORDS),
    META_REVISAO_REQUIRES_KEYWORD: parseBoolean(process.env.META_REVISAO_REQUIRES_KEYWORD, false),
    META_REVISAO_COUNT_BOTS: parseBoolean(process.env.META_REVISAO_COUNT_BOTS, false),
    CH_DENUNCIA_ALLOWED_CHANNELS: parseCsv(process.env.CH_DENUNCIA_ALLOWED_CHANNELS),
    DENUNCIA_KEYWORDS: parseCsv(process.env.DENUNCIA_KEYWORDS),
    META_DENUNCIA_REQUIRES_KEYWORD: parseBoolean(process.env.META_DENUNCIA_REQUIRES_KEYWORD, false),
    META_DENUNCIA_COUNT_BOTS: parseBoolean(process.env.META_DENUNCIA_COUNT_BOTS, false),
    CH_BANHACK_CHANNEL_ID: process.env.CH_BANHACK_CHANNEL_ID || "",
    BANHACK_KEYWORDS: parseCsv(process.env.BANHACK_KEYWORDS),
    META_BANHACK_REQUIRES_KEYWORD: parseBoolean(process.env.META_BANHACK_REQUIRES_KEYWORD, false),
    META_BANHACK_COUNT_BOTS: parseBoolean(process.env.META_BANHACK_COUNT_BOTS, false),
    STAFF_SYNC_URL: process.env.STAFF_SYNC_URL || "",
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
    VERCEL_BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_READ_WRITE_TOKEN || "",
    INTERNAL_BOT_KEY: process.env.INTERNAL_BOT_KEY || "",
    NODE_ENV: process.env.NODE_ENV || "development"
  };
}

module.exports = { getEnv, parseCsv, parseBoolean };
const { getEnv } = require("./env");

const DISCORD_API = "https://discord.com/api";

/**
 * Gera a URL de authorize do Discord dinamicamente.
 * redirect_uri é apenas o valor de DISCORD_REDIRECT_URI, codificado uma vez.
 */
function buildAuthUrl(state) {
  const env = getEnv();
  const authorizeUrl =
    "https://discord.com/oauth2/authorize" +
    "?client_id=" + env.DISCORD_CLIENT_ID +
    "&response_type=code" +
    "&redirect_uri=" + encodeURIComponent(env.DISCORD_REDIRECT_URI) +
    "&scope=identify%20guilds.members.read" +
    "&state=" + state;
  return authorizeUrl;
}

async function exchangeCode(code) {
  const env = getEnv();
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Falha ao trocar code por token.");
  }

  return response.json();
}

async function fetchUser(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error("Falha ao buscar usuário no Discord.");
  }
  return response.json();
}

async function fetchGuildMember(accessToken) {
  const env = getEnv();
  const response = await fetch(`${DISCORD_API}/users/@me/guilds/${env.GUILD_ID}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error("Falha ao validar membro no servidor.");
  }
  return response.json();
}

module.exports = { buildAuthUrl, exchangeCode, fetchUser, fetchGuildMember };
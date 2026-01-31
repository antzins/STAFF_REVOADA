const { exchangeCode, fetchUser, fetchGuildMember } = require("../../src/services/discordApi");
const { createSession, setSessionCookie, getAllowedRoles } = require("../../src/services/authService");
const { sendJson } = require("../../src/services/http");

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const match = parts.find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = getCookieValue(req.headers.cookie || "", "revoada_oauth_state");

    if (!code || !state || !cookieState || state !== cookieState) {
      sendJson(res, 400, { error: true, message: "OAuth state inválido." });
      return;
    }

    const tokenData = await exchangeCode(code);
    const user = await fetchUser(tokenData.access_token);
    const member = await fetchGuildMember(tokenData.access_token);

    const allowedRoles = getAllowedRoles();
    const hasAccess = allowedRoles.length === 0 || member.roles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      sendJson(res, 403, { error: true, message: "Acesso negado: você não possui permissão." });
      return;
    }

    const session = createSession({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      roles: member.roles
    });

    setSessionCookie(res, session);
    res.statusCode = 302;
    res.setHeader("Location", "/index.html");
    res.end();
  } catch (error) {
    sendJson(res, 500, { error: true, message: error.message || "Erro ao autenticar." });
  }
};
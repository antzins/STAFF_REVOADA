const crypto = require("crypto");
const { buildAuthUrl } = require("../../src/services/discordApi");

module.exports = async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const url = buildAuthUrl(state);
  res.setHeader("Set-Cookie", `revoada_oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.end();
};
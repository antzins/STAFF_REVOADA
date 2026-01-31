const { clearSessionCookie } = require("../../src/services/authService");

module.exports = async (req, res) => {
  clearSessionCookie(res);
  res.statusCode = 302;
  res.setHeader("Location", "/login.html");
  res.end();
};
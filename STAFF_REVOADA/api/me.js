const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");

module.exports = async (req, res) => {
  try {
    const user = requireAuth(req);
    sendJson(res, 200, { user });
  } catch (error) {
    handleError(res, error);
  }
};
const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");
const { listAvailableMonths } = require("../src/services/metasByMonth");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const meses = await listAvailableMonths();
    sendJson(res, 200, meses);
  } catch (error) {
    handleError(res, error);
  }
};
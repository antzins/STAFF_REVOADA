const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");
const { getMetasByMonth } = require("../src/services/metasByMonth");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mes = url.searchParams.get("mes");
    const { metas, source } = await getMetasByMonth(mes);
    sendJson(res, 200, { mes: source, metas });
  } catch (error) {
    handleError(res, error);
  }
};
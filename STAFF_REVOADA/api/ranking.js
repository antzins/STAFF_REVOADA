const { getRanking } = require("../src/services/dataService");
const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");
const { getMetasByMonth } = require("../src/services/metasByMonth");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tipo = url.searchParams.get("tipo");
    const cargo = url.searchParams.get("cargo");
    const mes = url.searchParams.get("mes");
    const { metas, source } = await getMetasByMonth(mes);
    const ranking = await getRanking({ tipo, cargo, metasOverride: metas });
    sendJson(res, 200, { mes: source, ranking });
  } catch (error) {
    handleError(res, error);
  }
};
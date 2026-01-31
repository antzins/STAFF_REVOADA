const { getUsuario } = require("../src/services/dataService");
const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");
const { getMetasByMonth } = require("../src/services/metasByMonth");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    const mes = url.searchParams.get("mes");
    if (!id) {
      sendJson(res, 400, { error: true, message: "Parâmetro id obrigatório." });
      return;
    }
    const { metas, source } = await getMetasByMonth(mes);
    const user = await getUsuario(id, metas);
    if (!user) {
      sendJson(res, 404, { error: true, message: "Usuário não encontrado." });
      return;
    }
    sendJson(res, 200, { ...user, mes: source });
  } catch (error) {
    handleError(res, error);
  }
};
const { getStorage } = require("../src/storage");
const { requireAuth } = require("../src/services/authService");
const { sendJson, handleError } = require("../src/services/http");

module.exports = async (req, res) => {
  try {
    requireAuth(req);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mes = url.searchParams.get("mes");
    if (!mes) {
      sendJson(res, 400, { error: true, message: "Parâmetro mes obrigatório (YYYY-MM)." });
      return;
    }
    const storage = getStorage();
    const data = await storage.readJson(`historico/metas-${mes}.json`, null);
    if (!data) {
      sendJson(res, 404, { error: true, message: "Histórico não encontrado." });
      return;
    }
    sendJson(res, 200, data);
  } catch (error) {
    handleError(res, error);
  }
};
const { rotateMonth } = require("../../src/services/backupService");
const { requireAuth, isAdmin } = require("../../src/services/authService");
const { sendJson, handleError } = require("../../src/services/http");

module.exports = async (req, res) => {
  try {
    let user = null;
    try {
      user = requireAuth(req);
    } catch (error) {
      user = null;
    }

    if (!isAdmin(req, user || {})) {
      const err = new Error("Acesso negado: rota admin.");
      err.status = 403;
      throw err;
    }

    const key = await rotateMonth();
    sendJson(res, 200, { ok: true, arquivo: key });
  } catch (error) {
    handleError(res, error);
  }
};
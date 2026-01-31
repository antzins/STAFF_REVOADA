const { getConfig, saveConfig } = require("../src/services/configService");
const { requireAuth, requireRole, getAllowedRoles } = require("../src/services/authService");
const { readJsonBody } = require("../src/services/body");
const { sendJson, handleError } = require("../src/services/http");
const { getEnv } = require("../src/services/env");

function hasInternalAccess(req) {
  const env = getEnv();
  const key = req.headers["x-internal-key"];
  if (!env.INTERNAL_BOT_KEY) return false;
  return key && key === env.INTERNAL_BOT_KEY;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const internalOk = hasInternalAccess(req);
      if (!internalOk) {
        requireAuth(req);
      }
      const config = await getConfig();
      sendJson(res, 200, config);
      return;
    }

    if (req.method === "POST") {
      const user = requireAuth(req);
      const allowedRoles = getAllowedRoles();
      if (!requireRole(user, allowedRoles)) {
        const err = new Error("Acesso negado: você não possui permissão.");
        err.status = 403;
        throw err;
      }
      const body = await readJsonBody(req);
      if (!body) {
        sendJson(res, 400, { error: true, message: "Payload vazio." });
        return;
      }
      const saved = await saveConfig(body);
      sendJson(res, 200, saved);
      return;
    }

    sendJson(res, 405, { error: true, message: "Método não suportado." });
  } catch (error) {
    handleError(res, error);
  }
};
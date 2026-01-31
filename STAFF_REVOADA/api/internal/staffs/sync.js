const { readJsonBody } = require("../../src/services/body");
const { sendJson, handleError } = require("../../src/services/http");
const { getEnv } = require("../../src/services/env");
const { upsertStaff, removeStaff } = require("../../src/services/staffsService");

function requireInternal(req) {
  const env = getEnv();
  const key = req.headers["x-internal-key"];
  if (!env.INTERNAL_BOT_KEY || key !== env.INTERNAL_BOT_KEY) {
    const err = new Error("Acesso negado: internal.");
    err.status = 403;
    throw err;
  }
}

module.exports = async (req, res) => {
  try {
    requireInternal(req);
    if (req.method !== "POST") {
      sendJson(res, 405, { error: true, message: "Método não suportado." });
      return;
    }
    const body = await readJsonBody(req);
    if (!body || !body.discordId) {
      sendJson(res, 400, { error: true, message: "Payload inválido." });
      return;
    }
    const action = body.acao || "upsert";
    if (action === "remove") {
      await removeStaff(body.discordId);
      sendJson(res, 200, { ok: true, action: "remove" });
      return;
    }
    const saved = await upsertStaff(body);
    sendJson(res, 200, { ok: true, action: "upsert", staff: saved });
  } catch (error) {
    handleError(res, error);
  }
};
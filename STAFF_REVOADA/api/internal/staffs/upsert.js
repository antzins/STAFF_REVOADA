const { readJsonBody } = require("../../src/services/body");
const { sendJson, handleError } = require("../../src/services/http");
const { getEnv } = require("../../src/services/env");
const { upsertStaff } = require("../../src/services/staffsService");

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
    if (!body || !Array.isArray(body.items)) {
      sendJson(res, 400, { error: true, message: "Payload inválido. Use { items: [] }." });
      return;
    }
    const results = [];
    for (const item of body.items) {
      if (!item.discordId) continue;
      const saved = await upsertStaff(item);
      results.push(saved);
    }
    sendJson(res, 200, { ok: true, count: results.length });
  } catch (error) {
    handleError(res, error);
  }
};
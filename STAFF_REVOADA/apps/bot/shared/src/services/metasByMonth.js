const { getStorage } = require("../storage");
const { getMetas } = require("./metaService");

function normalizeMonth(value) {
  if (!value) return null;
  if (value === "atual") return null;
  const match = String(value).match(/^\d{4}-\d{2}$/);
  return match ? value : null;
}

async function getMetasByMonth(mes) {
  const storage = getStorage();
  const normalized = normalizeMonth(mes);
  if (!normalized) {
    return { source: "atual", metas: await getMetas() };
  }
  const key = `historico/metas-${normalized}.json`;
  const data = await storage.readJson(key, null);
  if (!data) {
    const error = new Error("Histórico não encontrado para o mês informado.");
    error.status = 404;
    throw error;
  }
  return { source: normalized, metas: data };
}

async function listAvailableMonths() {
  const storage = getStorage();
  const keys = await storage.list("historico/");
  const months = keys
    .map((key) => key.match(/metas-(\d{4}-\d{2})\.json$/))
    .filter(Boolean)
    .map((match) => match[1]);
  const unique = Array.from(new Set(months)).sort().reverse();
  return ["atual", ...unique];
}

module.exports = { getMetasByMonth, listAvailableMonths };
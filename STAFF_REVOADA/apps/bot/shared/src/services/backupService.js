const { getStorage } = require("../storage");
const { getMetas, saveMetas, saveProcessadas } = require("./metaService");

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + "-" + [pad(date.getHours()), pad(date.getMinutes())].join("-");
}

function formatMonth(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function previousMonth(date) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() - 1);
  return copy;
}

async function backupActive() {
  const storage = getStorage();
  const metas = await getMetas();
  const timestamp = formatTimestamp(new Date());
  const key = `backups/metas-ativo-${timestamp}.json`;
  await storage.writeJson(key, metas);
  return key;
}

async function rotateMonth(forDate = new Date()) {
  const storage = getStorage();
  const metas = await getMetas();
  const monthKey = `historico/metas-${formatMonth(forDate)}.json`;
  await storage.writeJson(monthKey, metas);
  await saveMetas({});
  await saveProcessadas({});
  await storage.writeJson("rotation-state.json", { lastRotation: formatMonth(new Date()) });
  return monthKey;
}

async function ensureRotationIfNeeded() {
  const storage = getStorage();
  const state = await storage.readJson("rotation-state.json", { lastRotation: null });
  const currentMonth = formatMonth(new Date());
  if (state.lastRotation !== currentMonth) {
    await rotateMonth(previousMonth(new Date()));
  }
}

module.exports = { backupActive, rotateMonth, ensureRotationIfNeeded, formatMonth };
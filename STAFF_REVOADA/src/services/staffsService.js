const { getStorage } = require("../storage");

const STAFFS_KEY = "staffs.json";

async function getStaffsMap() {
  const storage = getStorage();
  const data = await storage.readJson(STAFFS_KEY, null);
  if (data == null || typeof data !== "object") return {};
  return data;
}

async function saveStaffsMap(data) {
  const storage = getStorage();
  await storage.writeJson(STAFFS_KEY, data);
}

function buildEntry({ discordId, nome, idServidor, roles, roleNames, cargoLabel, avatarUrl }) {
  return {
    discordId,
    nome,
    idServidor: idServidor || null,
    roles: roles || [],
    roleNames: Array.isArray(roleNames) ? roleNames : [],
    cargoLabel: cargoLabel || "",
    avatarUrl: avatarUrl || "",
    updatedAt: Date.now()
  };
}

async function upsertStaff(entry) {
  const map = await getStaffsMap();
  map[entry.discordId] = buildEntry(entry);
  await saveStaffsMap(map);
  return map[entry.discordId];
}

async function removeStaff(discordId) {
  const map = await getStaffsMap();
  delete map[discordId];
  await saveStaffsMap(map);
}

async function listStaffs() {
  const map = await getStaffsMap();
  if (Array.isArray(map)) return map;
  return Object.values(map || {});
}

module.exports = {
  STAFFS_KEY,
  getStaffsMap,
  saveStaffsMap,
  upsertStaff,
  removeStaff,
  listStaffs
};
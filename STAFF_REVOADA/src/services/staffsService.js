const { getStorage } = require("../storage");

const STAFFS_KEY = "staffs.json";
const ROLE_CATALOG_KEY = "staff-role-catalog.json";

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

async function getRoleCatalog() {
  const storage = getStorage();
  const data = await storage.readJson(ROLE_CATALOG_KEY, null);
  if (!data || !Array.isArray(data.roles)) return null;
  return data.roles;
}

async function saveRoleCatalog(roles) {
  if (!Array.isArray(roles)) return;
  const storage = getStorage();
  await storage.writeJson(ROLE_CATALOG_KEY, { roles, updatedAt: Date.now() });
}

module.exports = {
  STAFFS_KEY,
  ROLE_CATALOG_KEY,
  getStaffsMap,
  saveStaffsMap,
  upsertStaff,
  removeStaff,
  listStaffs,
  getRoleCatalog,
  saveRoleCatalog
};
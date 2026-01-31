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

function normalizeRole(role) {
  if (!role) return null;
  const id = String(role.id || role.roleId || role.role_id || "").trim();
  if (!id) return null;
  const name = String(role.name || role.label || role.id || "").trim();
  return { id, name: name || id };
}

function mergeRoleLists(base = [], incoming = []) {
  const map = new Map();
  base.forEach((role) => {
    const normalized = normalizeRole(role);
    if (normalized) map.set(normalized.id, normalized);
  });
  incoming.forEach((role) => {
    const normalized = normalizeRole(role);
    if (normalized) map.set(normalized.id, normalized);
  });
  return Array.from(map.values());
}

function extractRolesFromStaffEntries(entries = []) {
  const roles = [];
  entries.forEach((entry) => {
    (entry.roleNames || []).forEach((role) => {
      const normalized = normalizeRole(role);
      if (normalized) roles.push(normalized);
    });
  });
  return roles;
}

async function mergeRoleCatalog(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return;
  const existing = await getRoleCatalog();
  const merged = mergeRoleLists(existing || [], roles);
  if (merged.length === 0) return;
  const storage = getStorage();
  await storage.writeJson(ROLE_CATALOG_KEY, { roles: merged, updatedAt: Date.now() });
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
  saveRoleCatalog,
  mergeRoleCatalog,
  extractRolesFromStaffEntries
};

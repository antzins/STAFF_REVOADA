const crypto = require("crypto");
const { requireAuth, createSession, setSessionCookie, clearSessionCookie, getAllowedRoles, requireRole, isAdmin } = require("../src/services/authService");
const { buildAuthUrl, exchangeCode, fetchUser, fetchGuildMember } = require("../src/services/discordApi");
const { getConfig, saveConfig } = require("../src/services/configService");
const { readJsonBody } = require("../src/services/body");
const { sendJson, handleError } = require("../src/services/http");
const { getEnv } = require("../src/services/env");
const { getStorage } = require("../src/storage");
const { getUsuario, getRanking, getResumo } = require("../src/services/dataService");
const { getMetasByMonth, listAvailableMonths } = require("../src/services/metasByMonth");
const { listStaffs, upsertStaff, removeStaff } = require("../src/services/staffsService");
const { rotateMonth } = require("../src/services/backupService");

function getPathSegments(req) {
  const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
  const pathParam = url.searchParams.get("path");
  if (pathParam) return pathParam.split("/").filter(Boolean);
  const pathname = url.pathname || "";
  const afterApi = pathname.replace(/^\/api\/?/, "") || "";
  return afterApi ? afterApi.split("/").filter(Boolean) : [];
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const match = parts.find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function hasInternalAccess(req) {
  const env = getEnv();
  const key = req.headers["x-internal-key"];
  if (!env.INTERNAL_BOT_KEY) return false;
  return key && key === env.INTERNAL_BOT_KEY;
}

function requireInternal(req) {
  const env = getEnv();
  const key = req.headers["x-internal-key"];
  if (!env.INTERNAL_BOT_KEY || key !== env.INTERNAL_BOT_KEY) {
    const err = new Error("Acesso negado: internal.");
    err.status = 403;
    throw err;
  }
}

async function handleMe(req, res) {
  const user = requireAuth(req);
  sendJson(res, 200, { user });
}

async function handleAuthLogin(req, res) {
  const state = crypto.randomBytes(16).toString("hex");
  const url = buildAuthUrl(state);
  res.setHeader("Set-Cookie", `revoada_oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.end();
}

async function handleAuthLogout(req, res) {
  clearSessionCookie(res);
  res.statusCode = 302;
  res.setHeader("Location", "/login.html");
  res.end();
}

async function handleAuthCallback(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookieValue(req.headers.cookie || "", "revoada_oauth_state");

  if (!code || !state || !cookieState || state !== cookieState) {
    sendJson(res, 400, { error: true, message: "OAuth state inválido." });
    return;
  }

  const tokenData = await exchangeCode(code);
  const user = await fetchUser(tokenData.access_token);
  const member = await fetchGuildMember(tokenData.access_token);

  const allowedRoles = getAllowedRoles();
  const hasAccess = allowedRoles.length === 0 || member.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    sendJson(res, 403, { error: true, message: "Acesso negado: você não possui permissão." });
    return;
  }

  const session = createSession({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    roles: member.roles
  });

  setSessionCookie(res, session);
  res.statusCode = 302;
  res.setHeader("Location", "/index.html");
  res.end();
}

async function handleConfig(req, res) {
  if (req.method === "GET") {
    const internalOk = hasInternalAccess(req);
    if (!internalOk) requireAuth(req);
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
}

async function handleHistorico(req, res) {
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
}

async function handleUsuario(req, res) {
  requireAuth(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get("id");
  const mes = url.searchParams.get("mes");
  if (!id) {
    sendJson(res, 400, { error: true, message: "Parâmetro id obrigatório." });
    return;
  }
  const { metas, source } = await getMetasByMonth(mes);
  const user = await getUsuario(id, metas);
  if (!user) {
    sendJson(res, 404, { error: true, message: "Usuário não encontrado." });
    return;
  }
  sendJson(res, 200, { ...user, mes: source });
}

async function handleMesesDisponiveis(req, res) {
  requireAuth(req);
  const meses = await listAvailableMonths();
  sendJson(res, 200, meses);
}

async function handleMetas(req, res) {
  requireAuth(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const mes = url.searchParams.get("mes");
  const { metas, source } = await getMetasByMonth(mes);
  sendJson(res, 200, { mes: source, metas });
}

async function handleRanking(req, res) {
  requireAuth(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const tipo = url.searchParams.get("tipo");
  const cargo = url.searchParams.get("cargo");
  const mes = url.searchParams.get("mes");
  const { metas, source } = await getMetasByMonth(mes);
  const ranking = await getRanking({ tipo, cargo, metasOverride: metas });
  sendJson(res, 200, { mes: source, ranking });
}

async function handleResumo(req, res) {
  requireAuth(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const mes = url.searchParams.get("mes");
  const { metas, source } = await getMetasByMonth(mes);
  const resumo = await getResumo(metas);
  sendJson(res, 200, { ...resumo, mes: source });
}

async function handleStaffs(req, res) {
  requireAuth(req);
  const staffs = await listStaffs();
  sendJson(res, 200, staffs);
}

async function handleAdminRotacionar(req, res) {
  let user = null;
  try {
    user = requireAuth(req);
  } catch (e) {
    user = null;
  }
  if (!isAdmin(req, user || {})) {
    const err = new Error("Acesso negado: rota admin.");
    err.status = 403;
    throw err;
  }
  const key = await rotateMonth();
  sendJson(res, 200, { ok: true, arquivo: key });
}

async function handleInternalStaffsSync(req, res) {
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
}

async function handleInternalStaffsUpsert(req, res) {
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
}

const routes = {
  me: { GET: handleMe },
  "meses-disponiveis": { GET: handleMesesDisponiveis },
  metas: { GET: handleMetas },
  ranking: { GET: handleRanking },
  resumo: { GET: handleResumo },
  staffs: { GET: handleStaffs },
  historico: { GET: handleHistorico },
  usuario: { GET: handleUsuario },
  config: { GET: handleConfig, POST: handleConfig },
  auth: {
    login: { GET: handleAuthLogin },
    logout: { GET: handleAuthLogout },
    callback: { GET: handleAuthCallback }
  },
  admin: {
    rotacionar: { GET: handleAdminRotacionar, POST: handleAdminRotacionar }
  },
  internal: {
    staffs: {
      sync: { POST: handleInternalStaffsSync },
      upsert: { POST: handleInternalStaffsUpsert }
    }
  }
};

function route(segments, method) {
  if (segments.length === 0) return null;
  let node = routes;
  for (let i = 0; i < segments.length; i++) {
    node = node[segments[i]];
    if (!node) return null;
  }
  return node[method] || node.GET || node.POST || null;
}

module.exports = async (req, res) => {
  try {
    const segments = getPathSegments(req);
    const handler = route(segments, req.method);
    if (!handler) {
      sendJson(res, 404, { error: true, message: "Rota não encontrada." });
      return;
    }
    await handler(req, res);
  } catch (error) {
    handleError(res, error);
  }
};

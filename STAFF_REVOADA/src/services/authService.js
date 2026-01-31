const jwt = require("jsonwebtoken");
const { getEnv, parseCsv } = require("./env");

const COOKIE_NAME = "revoada_session";

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((item) => item.trim());
  const match = parts.find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function createSession(user) {
  const env = getEnv();
  return jwt.sign(user, env.SESSION_SECRET, { expiresIn: "12h" });
}

function verifySession(token) {
  const env = getEnv();
  return jwt.verify(token, env.SESSION_SECRET);
}

function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${12 * 60 * 60}`,
    isProd ? "Secure" : ""
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function clearSessionCookie(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function requireAuth(req) {
  const token = getCookieValue(req.headers.cookie || "", COOKIE_NAME);
  if (!token) {
    const error = new Error("Não autenticado.");
    error.status = 401;
    throw error;
  }
  try {
    return verifySession(token);
  } catch (error) {
    const err = new Error("Sessão inválida.");
    err.status = 401;
    throw err;
  }
}

function requireRole(user, allowedRoles) {
  if (!allowedRoles.length) return true;
  return user.roles && user.roles.some((role) => allowedRoles.includes(role));
}

function getAllowedRoles() {
  return parseCsv(process.env.STAFF_ALLOWED_ROLES || "");
}

function isAdmin(req, user) {
  const env = getEnv();
  const key = req.headers["x-admin-key"] || req.query?.adminKey;
  if (key && key === env.ADMIN_API_KEY) return true;
  const allowedRoles = getAllowedRoles();
  return requireRole(user, allowedRoles);
}

module.exports = {
  COOKIE_NAME,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireRole,
  getAllowedRoles,
  isAdmin
};
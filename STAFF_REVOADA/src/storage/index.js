const { getEnv } = require("../services/env");
const local = require("./local");
const vercelBlob = require("./vercelBlob");

let cachedProvider = null;

function getStorage() {
  if (cachedProvider) return cachedProvider;
  const env = getEnv();
  if (env.STORAGE_PROVIDER === "vercel_blob") {
    cachedProvider = vercelBlob.createProvider(env);
    return cachedProvider;
  }
  cachedProvider = local.createProvider();
  return cachedProvider;
}

module.exports = { getStorage };
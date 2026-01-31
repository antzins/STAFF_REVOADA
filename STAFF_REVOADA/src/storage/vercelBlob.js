const { put, list, del, get } = require("@vercel/blob");

function createProvider(env) {
  if (!env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing env: VERCEL_BLOB_READ_WRITE_TOKEN");
  }

  return {
    async readJson(key, fallback = {}) {
      try {
        const blob = await get(key, { token: env.VERCEL_BLOB_READ_WRITE_TOKEN });
        const text = await blob.text();
        return JSON.parse(text);
      } catch (error) {
        return fallback;
      }
    },
    async writeJson(key, data) {
      await put(key, JSON.stringify(data), {
        access: "private",
        addRandomSuffix: false,
        token: env.VERCEL_BLOB_READ_WRITE_TOKEN
      });
    },
    async list(prefix) {
      const result = await list({ prefix, token: env.VERCEL_BLOB_READ_WRITE_TOKEN });
      return result.blobs.map((blob) => blob.pathname);
    },
    async delete(key) {
      await del(key, { token: env.VERCEL_BLOB_READ_WRITE_TOKEN });
    }
  };
}

module.exports = { createProvider };
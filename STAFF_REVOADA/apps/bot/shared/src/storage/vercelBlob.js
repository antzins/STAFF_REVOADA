const { put, list, del, get } = require("@vercel/blob");

function createProvider(env) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing env: BLOB_READ_WRITE_TOKEN");
  }

  const token = env.BLOB_READ_WRITE_TOKEN;

  return {
    async readJson(key, fallback = {}) {
      try {
        const blob = await get(key, { token });
        const text = await blob.text();
        return JSON.parse(text);
      } catch (error) {
        return fallback;
      }
    },
    async writeJson(key, data) {
      await put(key, JSON.stringify(data), {
        access: "public",
        addRandomSuffix: false,
        token
      });
    },
    async list(prefix) {
      const result = await list({ prefix, token });
      return result.blobs.map((blob) => blob.pathname);
    },
    async delete(key) {
      await del(key, { token });
    }
  };
}

module.exports = { createProvider };
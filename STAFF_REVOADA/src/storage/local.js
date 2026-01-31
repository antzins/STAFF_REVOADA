const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "data");

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function resolveKey(key) {
  return path.join(ROOT, key);
}

function createProvider() {
  return {
    async readJson(key, fallback = {}) {
      const filePath = resolveKey(key);
      if (!fs.existsSync(filePath)) {
        return fallback;
      }
      const raw = await fs.promises.readFile(filePath, "utf8");
      try {
        return JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },
    async writeJson(key, data) {
      const filePath = resolveKey(key);
      ensureDir(filePath);
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    },
    async list(prefix) {
      const basePath = resolveKey(prefix);
      const dir = fs.existsSync(basePath) ? basePath : path.dirname(basePath);
      if (!fs.existsSync(dir)) return [];
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(prefix.replace(/[/\\]$/g, ""), entry.name));
    },
    async delete(key) {
      const filePath = resolveKey(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  };
}

module.exports = { createProvider };
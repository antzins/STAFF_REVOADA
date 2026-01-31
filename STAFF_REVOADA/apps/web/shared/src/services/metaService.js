const { getStorage } = require("../storage");
const { META_TYPES } = require("./metaTypes");

const METAS_KEY = "metas-ativo.json";
const PROCESSADAS_KEY = "processadas.json";

async function getMetas() {
  const storage = getStorage();
  return storage.readJson(METAS_KEY, {});
}

async function saveMetas(data) {
  const storage = getStorage();
  await storage.writeJson(METAS_KEY, data);
}

async function getProcessadas() {
  const storage = getStorage();
  return storage.readJson(PROCESSADAS_KEY, {});
}

async function saveProcessadas(data) {
  const storage = getStorage();
  await storage.writeJson(PROCESSADAS_KEY, data);
}

function createAuditEntry({ timestamp, canalId, mensagemId, tipo, autorRegistro, observacao }) {
  return {
    timestamp,
    canalId,
    mensagemId,
    tipo,
    autorRegistro,
    observacao
  };
}

async function registerActions({ messageId, channelId, authorId, targets, tipo }) {
  if (!tipo || !Object.values(META_TYPES).includes(tipo)) {
    throw new Error("Tipo de meta inválido.");
  }

  const metas = await getMetas();
  const processadas = await getProcessadas();

  if (processadas[messageId]) {
    return { skipped: true };
  }

  const timestamp = Date.now();
  for (const target of targets) {
    const targetId = target.id;
    const roleName = target.roleName || "";

    if (!metas[targetId]) {
      metas[targetId] = { totalAcoes: 0, acoes: [], cargoStaff: roleName };
    }

    metas[targetId].totalAcoes += 1;
    metas[targetId].acoes.push(
      createAuditEntry({
        timestamp,
        canalId: channelId,
        mensagemId: messageId,
        tipo,
        autorRegistro: authorId,
        observacao: target.observacao || "menção em mensagem de metas"
      })
    );

    if (roleName) {
      metas[targetId].cargoStaff = roleName;
    }
  }

  processadas[messageId] = true;

  await saveMetas(metas);
  await saveProcessadas(processadas);

  return { skipped: false, count: targets.length };
}

function summarizeUser(userData) {
  const summary = {
    totalAcoes: userData.totalAcoes || 0,
    porTipo: {}
  };

  for (const action of userData.acoes || []) {
    summary.porTipo[action.tipo] = (summary.porTipo[action.tipo] || 0) + 1;
  }

  return summary;
}

module.exports = {
  METAS_KEY,
  PROCESSADAS_KEY,
  getMetas,
  saveMetas,
  getProcessadas,
  saveProcessadas,
  registerActions,
  summarizeUser
};
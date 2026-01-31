const { getMetas } = require("./metaService");
const { META_TYPES } = require("./metaTypes");

function buildResumo(metas) {
  const resumo = {
    totalAcoes: 0,
    porTipo: {},
    totalUsuarios: Object.keys(metas).length
  };

  for (const tipo of Object.values(META_TYPES)) {
    resumo.porTipo[tipo] = 0;
  }

  for (const userData of Object.values(metas)) {
    resumo.totalAcoes += userData.totalAcoes || 0;
    for (const action of userData.acoes || []) {
      if (resumo.porTipo[action.tipo] !== undefined) {
        resumo.porTipo[action.tipo] += 1;
      }
    }
  }

  return resumo;
}

function buildRanking(metas, tipo, cargo) {
  const entries = Object.entries(metas).map(([userId, userData]) => {
    const counts = {};
    for (const action of userData.acoes || []) {
      counts[action.tipo] = (counts[action.tipo] || 0) + 1;
    }

    return {
      userId,
      cargoStaff: userData.cargoStaff || "",
      totalAcoes: userData.totalAcoes || 0,
      counts
    };
  });

  const filtered = entries.filter((entry) => {
    if (cargo && entry.cargoStaff !== cargo) return false;
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const aValue = tipo ? (a.counts[tipo] || 0) : a.totalAcoes;
    const bValue = tipo ? (b.counts[tipo] || 0) : b.totalAcoes;
    return bValue - aValue;
  });

  return sorted;
}

async function getResumo(metasOverride) {
  const metas = metasOverride || await getMetas();
  return buildResumo(metas);
}

async function getRanking({ tipo, cargo, metasOverride }) {
  const metas = metasOverride || await getMetas();
  return buildRanking(metas, tipo, cargo);
}

async function getUsuario(id, metasOverride) {
  const metas = metasOverride || await getMetas();
  return metas[id] || null;
}

module.exports = { getResumo, getRanking, getUsuario, buildResumo, buildRanking };
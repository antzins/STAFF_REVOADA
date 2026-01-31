(async () => {
  const tableBody = document.querySelector("#rankingTable tbody");
  const tipoSelect = document.getElementById("tipoSelect");
  const mesSelect = document.getElementById("mesSelectRanking");
  const cargoSelect = document.getElementById("cargoSelectRanking");
  const refreshButton = document.getElementById("refreshRanking");

  let cargoNameToId = new Map();
  let roleIdToName = new Map();

  async function loadMeses() {
    const meses = await app.apiFetch("/api/meses-disponiveis");
    mesSelect.innerHTML = "";
    meses.forEach((mes) => {
      const option = document.createElement("option");
      option.value = mes;
      option.textContent = mes === "atual" ? "Janeiro/2026" : mes;
      mesSelect.appendChild(option);
    });
    const stored = app.getSelectedMonth();
    mesSelect.value = meses.includes(stored) ? stored : "atual";
  }

  async function loadCargos() {
    try {
      const res = await app.apiFetch("/api/staff-roles");
      const roles = (res && res.roles) ? res.roles : [];
      cargoNameToId = new Map();
      roleIdToName = new Map();
      cargoSelect.innerHTML = '<option value="">Todos os cargos</option>';
      roles.forEach((r) => {
        const name = (r.name || r.label || "").trim();
        const id = String(r.id || "").trim();
        if (name && id) {
          cargoNameToId.set(name, name);
          roleIdToName.set(id, name);
          roleIdToName.set(name, name);
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          cargoSelect.appendChild(option);
        }
      });
    } catch {
      cargoSelect.innerHTML = '<option value="">Todos os cargos</option>';
    }
  }

  function displayCargo(cargoStaff) {
    if (!cargoStaff) return "-";
    return roleIdToName.get(String(cargoStaff)) || cargoStaff;
  }

  async function loadRanking() {
    tableBody.innerHTML = "";
    const tipo = tipoSelect.value;
    const mes = mesSelect.value || "atual";
    const cargo = (cargoSelect && cargoSelect.value) ? cargoSelect.value.trim() : "";
    app.setSelectedMonth(mes);
    const query = new URLSearchParams();
    if (tipo) query.set("tipo", tipo);
    if (mes) query.set("mes", mes);
    if (cargo) query.set("cargo", cargo);
    const response = await app.apiFetch(`/api/ranking?${query.toString()}`);
    const data = response.ranking || [];
    data.slice(0, 50).forEach((entry, index) => {
      const value = tipo ? (entry.counts[tipo] || 0) : entry.totalAcoes;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.userId}</td>
        <td>${displayCargo(entry.cargoStaff)}</td>
        <td>${value}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  await loadMeses();
  await loadCargos();
  await loadRanking();

  refreshButton.addEventListener("click", () => loadRanking());
  tipoSelect.addEventListener("change", () => loadRanking());
  mesSelect.addEventListener("change", () => loadRanking());
  if (cargoSelect) cargoSelect.addEventListener("change", () => loadRanking());
})();
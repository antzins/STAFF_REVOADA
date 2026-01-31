(async () => {
  const tableBody = document.querySelector("#rankingTable tbody");
  const tipoSelect = document.getElementById("tipoSelect");
  const mesSelect = document.getElementById("mesSelectRanking");
  const refreshButton = document.getElementById("refreshRanking");

  async function loadMeses() {
    const meses = await app.apiFetch("/api/meses-disponiveis");
    mesSelect.innerHTML = "";
    meses.forEach((mes) => {
      const option = document.createElement("option");
      option.value = mes;
      option.textContent = mes === "atual" ? "Mês atual" : mes;
      mesSelect.appendChild(option);
    });
    const stored = app.getSelectedMonth();
    mesSelect.value = meses.includes(stored) ? stored : "atual";
  }

  async function loadRanking() {
    tableBody.innerHTML = "";
    const tipo = tipoSelect.value;
    const mes = mesSelect.value || "atual";
    app.setSelectedMonth(mes);
    const query = new URLSearchParams();
    if (tipo) query.set("tipo", tipo);
    if (mes) query.set("mes", mes);
    const response = await app.apiFetch(`/api/ranking?${query.toString()}`);
    const data = response.ranking || [];
    data.slice(0, 50).forEach((entry, index) => {
      const value = tipo ? (entry.counts[tipo] || 0) : entry.totalAcoes;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.userId}</td>
        <td>${entry.cargoStaff || "-"}</td>
        <td>${value}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  await loadMeses();
  await loadRanking();

  refreshButton.addEventListener("click", () => loadRanking());
  tipoSelect.addEventListener("change", () => loadRanking());
  mesSelect.addEventListener("change", () => loadRanking());
})();
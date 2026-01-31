(async () => {
  const mesSelect = document.getElementById("mesSelectDashboard");

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

  async function loadResumo() {
    const mes = mesSelect.value || "atual";
    app.setSelectedMonth(mes);
    const resumo = await app.apiFetch(`/api/resumo?mes=${encodeURIComponent(mes)}`);
    document.getElementById("totalAcoes").textContent = resumo.totalAcoes;
    document.getElementById("totalRevisoes").textContent = resumo.porTipo.REVISAO || 0;
    document.getElementById("totalDenuncias").textContent = resumo.porTipo.DENUNCIA || 0;
    document.getElementById("totalBanHack").textContent = resumo.porTipo.BAN_HACK || 0;
    const totalBansEl = document.getElementById("totalBans");
    if (totalBansEl) totalBansEl.textContent = resumo.porTipo.BAN || 0;
    document.getElementById("totalUsuarios").textContent = resumo.totalUsuarios;
  }

  try {
    await loadMeses();
    await loadResumo();
  } catch (error) {
    app.showToast("Falha ao carregar", "Armazenamento indisponível no momento. Tente novamente.", "error");
  }

  mesSelect.addEventListener("change", () => {
    loadResumo().catch(() => {
      app.showToast("Falha", "Não foi possível carregar o mês selecionado.", "error");
    });
  });
})();
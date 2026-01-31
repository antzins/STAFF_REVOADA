(() => {
  const tableBody = document.querySelector("#staffsTable tbody");
  const filterNome = document.getElementById("filterNome");
  const filterServidor = document.getElementById("filterServidor");
  const filterDiscord = document.getElementById("filterDiscord");
  const filterCargo = document.getElementById("filterCargo");

  let data = [];

  function buildCargoOptions() {
    filterCargo.innerHTML = '<option value="">Todos os Cargos</option>';
    const cargos = Array.from(new Set(data.map((item) => item.cargoLabel || item.cargo))).filter(Boolean).sort();
    cargos.forEach((cargo) => {
      const option = document.createElement("option");
      option.value = cargo;
      option.textContent = cargo;
      filterCargo.appendChild(option);
    });
  }

  function matchesFilters(item) {
    const nome = filterNome.value.trim().toLowerCase();
    const servidor = filterServidor.value.trim();
    const discord = filterDiscord.value.trim();
    const cargo = filterCargo.value.trim();

    const nomeValue = (item.nome || "").toLowerCase();
    const servidorValue = String(item.idServidor || "");
    const discordValue = String(item.discordId || "");
    const cargoValue = item.cargoLabel || "";

    if (nome && !nomeValue.includes(nome)) return false;
    if (servidor && !servidorValue.includes(servidor)) return false;
    if (discord && !discordValue.includes(discord)) return false;
    if (cargo && cargoValue !== cargo) return false;
    return true;
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const filtered = data.filter(matchesFilters);

    filtered.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.nome || "-"}</td>
        <td>${item.idServidor || "-"}</td>
        <td>${item.discordId || "-"}</td>
        <td><span class="badge">${item.cargoLabel || "-"}</span></td>
        <td>
          <button class="secondary" data-action="ver">Ver</button>
          <button class="secondary" data-action="editar">Editar</button>
          <button class="secondary" data-action="excluir" style="color: var(--danger)">Excluir</button>
        </td>
        <td>
          <button class="secondary" data-action="detalhes">Ver Detalhes</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  async function loadStaffs() {
    data = await app.apiFetch("/api/staffs");
    buildCargoOptions();
    renderTable();
  }

  [filterNome, filterServidor, filterDiscord, filterCargo].forEach((input) => {
    input.addEventListener("input", renderTable);
    input.addEventListener("change", renderTable);
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    app.showToast("Ação", `Botão ${action} acionado (placeholder).`, "info");
  });

  loadStaffs().catch(() => {
    app.showToast("Falha", "Não foi possível carregar a lista de staffs.", "error");
  });
})();
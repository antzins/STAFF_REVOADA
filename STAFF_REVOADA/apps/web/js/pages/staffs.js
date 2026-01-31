(() => {
  const tableBody = document.querySelector("#staffsTable tbody");
  const filterNome = document.getElementById("filterNome");
  const filterServidor = document.getElementById("filterServidor");
  const filterDiscord = document.getElementById("filterDiscord");
  const filterCargo = document.getElementById("filterCargo");
  const emptyMessage = document.getElementById("staffsEmptyMessage");

  let data = [];
  let rolesFromEnv = [];

  function getAllRoleNames() {
    const names = new Set();
    data.forEach((item) => {
      if (item.cargoLabel && item.cargoLabel.trim()) names.add(item.cargoLabel.trim());
      (item.roleNames || []).forEach((r) => {
        if (r.name && String(r.name).trim()) names.add(String(r.name).trim());
      });
    });
    return Array.from(names).sort();
  }

  function buildCargoOptions() {
    filterCargo.innerHTML = '<option value="">Todos os Cargos</option>';
    const fromData = getAllRoleNames();
    const fromEnv = rolesFromEnv.map((r) => (r.name || r.label || r.id).trim()).filter(Boolean);
    const allCargos = Array.from(new Set([...fromData, ...fromEnv])).sort();
    allCargos.forEach((cargo) => {
      const option = document.createElement("option");
      option.value = cargo;
      option.textContent = cargo;
      filterCargo.appendChild(option);
    });
  }

  function staffHasRole(item, roleName) {
    if (!roleName) return false;
    const r = roleName.trim();
    if ((item.cargoLabel || "").trim() === r) return true;
    return (item.roleNames || []).some((x) => String(x.name || "").trim() === r);
  }

  function matchesFilters(item) {
    const nome = filterNome.value.trim().toLowerCase();
    const servidor = filterServidor.value.trim();
    const discord = filterDiscord.value.trim();
    const cargo = filterCargo.value.trim();

    const nomeValue = (item.nome || "").toLowerCase();
    const servidorValue = String(item.idServidor || "");
    const discordValue = String(item.discordId || "");

    if (nome && !nomeValue.includes(nome)) return false;
    if (servidor && !servidorValue.includes(servidor)) return false;
    if (discord && !discordValue.includes(discord)) return false;
    if (cargo && !staffHasRole(item, cargo)) return false;
    return true;
  }

  function getRoleNamesForDisplay(item) {
    const names = new Set();
    if (item.cargoLabel && item.cargoLabel.trim()) names.add(item.cargoLabel.trim());
    (item.roleNames || []).forEach((r) => {
      if (r.name && String(r.name).trim()) names.add(String(r.name).trim());
    });
    return Array.from(names);
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const filtered = data.filter(matchesFilters);

    filtered.forEach((item) => {
      const roleNames = getRoleNamesForDisplay(item);
      const cargoBadges = roleNames.length
        ? roleNames.map((n) => `<span class="badge">${escapeHtml(n)}</span>`).join(" ")
        : "-";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(item.nome || "-")}</td>
        <td>${escapeHtml(String(item.idServidor || "-"))}</td>
        <td>${escapeHtml(String(item.discordId || "-"))}</td>
        <td>${cargoBadges}</td>
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

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderRelatorioPorCargo() {
    const container = document.getElementById("relatorioPorCargoContent");
    const section = document.getElementById("relatorioPorCargo");
    if (!container) return;
    const roleNames = getAllRoleNames();
    if (roleNames.length === 0) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";
    container.innerHTML = roleNames
      .map((roleName) => {
        const users = data.filter((item) => staffHasRole(item, roleName)).map((item) => item.nome || item.discordId || "-");
        return `<div class="relatorio-cargo-item" style="margin-bottom:1rem"><strong>${escapeHtml(roleName)}</strong>: ${users.map((u) => escapeHtml(u)).join(", ") || "-"}</div>`;
      })
      .join("");
  }

  async function loadStaffs() {
    try {
      const [staffsRes, rolesRes] = await Promise.all([
        app.apiFetch("/api/staffs"),
        app.apiFetch("/api/staff-roles").catch(() => ({ roles: [] }))
      ]);
      data = Array.isArray(staffsRes) ? staffsRes : [];
      rolesFromEnv = (rolesRes && rolesRes.roles) ? rolesRes.roles : [];
      buildCargoOptions();
      renderTable();
      renderRelatorioPorCargo();
      if (emptyMessage) {
        emptyMessage.style.display = data.length === 0 ? "block" : "none";
      }
    } catch (e) {
      data = [];
      rolesFromEnv = [];
      buildCargoOptions();
      renderTable();
      renderRelatorioPorCargo();
      if (emptyMessage) emptyMessage.style.display = "block";
    }
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
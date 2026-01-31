(() => {
  const tableBody = document.querySelector("#staffsTable tbody");
  const filterNome = document.getElementById("filterNome");
  const filterServidor = document.getElementById("filterServidor");
  const filterDiscord = document.getElementById("filterDiscord");
  const filterCargo = document.getElementById("filterCargo");
  const emptyMessage = document.getElementById("staffsEmptyMessage");

  let data = [];
  let rolesFromEnv = [];

  function getEnvRoleIds() {
    return rolesFromEnv.map((r) => String(r.id || "")).filter(Boolean);
  }

  function getRoleNameToIdMap() {
    const map = new Map();
    rolesFromEnv.forEach((r) => {
      const name = (r.name || r.label || "").trim();
      if (name) map.set(name, String(r.id || ""));
    });
    return map;
  }

  function buildCargoOptions() {
    filterCargo.innerHTML = '<option value="">Todos os Cargos</option>';
    const namesFromEnv = rolesFromEnv.map((r) => (r.name || r.label || r.id).trim()).filter(Boolean);
    const fromData = new Set();
    data.forEach((item) => {
      const resolved = resolveRoleName(item);
      resolved.forEach((n) => fromData.add(n));
    });
    const extra = Array.from(fromData).filter((n) => !namesFromEnv.includes(n));
    const allCargos = [...namesFromEnv, ...extra];
    allCargos.forEach((cargo) => {
      const option = document.createElement("option");
      option.value = cargo;
      option.textContent = cargo;
      filterCargo.appendChild(option);
    });
  }

  function resolveRoleName(item) {
    const names = new Set();
    const idToName = new Map();
    rolesFromEnv.forEach((r) => {
      const name = (r.name || r.label || "").trim();
      if (name) idToName.set(String(r.id), name);
    });
    const label = (item.cargoLabel || "").trim();
    if (label && !/^\d{17,19}$/.test(label)) names.add(label);
    else if (label && idToName.has(label)) names.add(idToName.get(label));
    (item.roleNames || []).forEach((r) => {
      const n = String(r.name || r.label || "").trim();
      const id = String(r.id || "").trim();
      if (n && !/^\d{17,19}$/.test(n)) names.add(n);
      else if (id && idToName.has(id)) names.add(idToName.get(id));
    });
    if (label && /^\d{17,19}$/.test(label) && idToName.has(label)) names.add(idToName.get(label));
    return Array.from(names);
  }

  function staffHasRole(item, roleName) {
    if (!roleName) return false;
    const r = roleName.trim();
    const roleId = getRoleNameToIdMap().get(r);
    const itemRoleIds = new Set([
      ...(item.roles || []).map((x) => String(x)),
      ...(item.roleNames || []).map((x) => String(x.id || ""))
    ]);
    if (roleId && itemRoleIds.has(roleId)) return true;
    const resolved = resolveRoleName(item);
    return resolved.includes(r);
  }

  function isStaffInEnv(item) {
    const envIds = getEnvRoleIds();
    if (envIds.length === 0) return true;
    const itemRoleIds = new Set([
      ...(item.roles || []).map((x) => String(x)),
      ...(item.roleNames || []).map((x) => String(x.id || ""))
    ]);
    return envIds.some((id) => itemRoleIds.has(id));
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
    return resolveRoleName(item);
  }

  function renderTable() {
    tableBody.innerHTML = "";
    const filtered = data.filter(isStaffInEnv).filter(matchesFilters);

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
    const staffEligible = data.filter(isStaffInEnv);
    const canonicalRoles = rolesFromEnv
      .map((r) => ({ id: String(r.id), name: (r.name || r.label || r.id).trim() }))
      .filter((r) => r.name);
    if (canonicalRoles.length === 0) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";
    container.innerHTML = canonicalRoles
      .map((role) => {
        const users = staffEligible
          .filter((item) => {
            const itemIds = new Set([
              ...(item.roles || []).map(String),
              ...(item.roleNames || []).map((r) => String(r.id || ""))
            ]);
            return itemIds.has(role.id);
          })
          .map((item) => item.nome || item.discordId || "-");
        return `<div class="relatorio-cargo-item" style="margin-bottom:1rem"><strong>${escapeHtml(role.name)}</strong>: ${users.map((u) => escapeHtml(u)).join(", ") || "-"}</div>`;
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

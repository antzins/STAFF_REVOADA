(() => {
  const input = document.getElementById("userIdInput");
  const button = document.getElementById("buscarUsuario");
  const resumo = document.getElementById("usuarioResumo");
  const cabecalho = document.getElementById("usuarioCabecalho");

  function renderHeader(staff) {
    if (!staff) {
      cabecalho.style.display = "none";
      cabecalho.innerHTML = "";
      return;
    }
    const avatar = staff.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
    cabecalho.style.display = "flex";
    cabecalho.innerHTML = `
      <img src="${avatar}" alt="Avatar" />
      <div>
        <div>${staff.nome || "Usuário"}</div>
        <div style="font-size:0.8rem;color:var(--muted)">${staff.cargoLabel || "-"}</div>
      </div>
      <div style="margin-left:auto;font-size:0.85rem;color:var(--muted)">${staff.discordId}</div>
    `;
  }

  async function buscar() {
    const id = input.value.trim();
    if (!id) {
      app.showToast("Atenção", "Informe um Discord ID válido.", "warning");
      return;
    }
    try {
      const [data, staffs] = await Promise.all([
        app.apiFetch(`/api/usuario?id=${encodeURIComponent(id)}`),
        app.apiFetch("/api/staffs")
      ]);

      const staff = Array.isArray(staffs)
        ? staffs.find((item) => String(item.discordId) === id)
        : null;

      renderHeader(staff);

      const counts = data.acoes.reduce((acc, action) => {
        acc[action.tipo] = (acc[action.tipo] || 0) + 1;
        return acc;
      }, {});
      resumo.innerHTML = `
        <div class="card">
          <h3>Total de Ações</h3>
          <div class="value">${data.totalAcoes}</div>
        </div>
        <div class="card">
          <h3>Revisão</h3>
          <div class="value">${counts.REVISAO || 0}</div>
        </div>
        <div class="card">
          <h3>Denúncia</h3>
          <div class="value">${counts.DENUNCIA || 0}</div>
        </div>
        <div class="card">
          <h3>Ban Hack</h3>
          <div class="value">${counts.BAN_HACK || 0}</div>
        </div>
        <div class="card">
          <h3>Ban</h3>
          <div class="value">${counts.BAN || 0}</div>
        </div>
      `;
    } catch (error) {
      resumo.innerHTML = "";
      renderHeader(null);
      app.showToast("Falha", error.message || "Não foi possível carregar o usuário.", "error");
    }
  }

  button.addEventListener("click", buscar);
})();
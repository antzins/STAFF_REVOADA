(() => {
  const mesInput = document.getElementById("mesInput");
  const button = document.getElementById("buscarHistorico");
  const tableBody = document.querySelector("#historicoTable tbody");

  async function carregar() {
    const mes = mesInput.value;
    if (!mes) {
      app.showToast("Atenção", "Selecione um mês.", "warning");
      return;
    }
    tableBody.innerHTML = "";
    try {
      const data = await app.apiFetch(`/api/historico?mes=${encodeURIComponent(mes)}`);
      Object.entries(data).forEach(([userId, userData]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${userId}</td>
          <td>${userData.cargoStaff || "-"}</td>
          <td>${userData.totalAcoes || 0}</td>
        `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      tableBody.innerHTML = "";
    }
  }

  button.addEventListener("click", carregar);
})();
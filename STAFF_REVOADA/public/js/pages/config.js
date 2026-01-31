(async () => {
  const form = document.getElementById("configForm");

  const fields = {
    fallbackEnabled: document.getElementById("fallbackEnabled"),
    tipoTicketAceito: document.getElementById("tipoTicketAceito"),
    tipoTicketNegado: document.getElementById("tipoTicketNegado"),
    tipoRevisao: document.getElementById("tipoRevisao"),
    tipoBan: document.getElementById("tipoBan"),
    tagsTicketAceito: document.getElementById("tagsTicketAceito"),
    tagsTicketNegado: document.getElementById("tagsTicketNegado"),
    tagsRevisao: document.getElementById("tagsRevisao"),
    tagsBan: document.getElementById("tagsBan")
  };

  function linesToArray(text) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function arrayToLines(list) {
    return (list || []).join("\n");
  }

  const config = await app.apiFetch("/api/config");
  fields.fallbackEnabled.checked = config.metaFallbackEnabled;
  fields.tipoTicketAceito.checked = config.enabledMetaTypes.TICKET_ACEITO;
  fields.tipoTicketNegado.checked = config.enabledMetaTypes.TICKET_NEGADO;
  fields.tipoRevisao.checked = config.enabledMetaTypes.REVISAO;
  fields.tipoBan.checked = config.enabledMetaTypes.BAN;

  fields.tagsTicketAceito.value = arrayToLines(config.fallbackTags.TICKET_ACEITO);
  fields.tagsTicketNegado.value = arrayToLines(config.fallbackTags.TICKET_NEGADO);
  fields.tagsRevisao.value = arrayToLines(config.fallbackTags.REVISAO);
  fields.tagsBan.value = arrayToLines(config.fallbackTags.BAN);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      metaFallbackEnabled: fields.fallbackEnabled.checked,
      enabledMetaTypes: {
        TICKET_ACEITO: fields.tipoTicketAceito.checked,
        TICKET_NEGADO: fields.tipoTicketNegado.checked,
        REVISAO: fields.tipoRevisao.checked,
        BAN: fields.tipoBan.checked
      },
      fallbackTags: {
        TICKET_ACEITO: linesToArray(fields.tagsTicketAceito.value),
        TICKET_NEGADO: linesToArray(fields.tagsTicketNegado.value),
        REVISAO: linesToArray(fields.tagsRevisao.value),
        BAN: linesToArray(fields.tagsBan.value)
      }
    };

    try {
      await app.apiFetch("/api/config", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      app.showToast("Sucesso", "Configurações salvas.", "success");
    } catch (error) {
      app.showToast("Erro", error.message, "error");
    }
  });
})();
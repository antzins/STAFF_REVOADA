(async () => {
  const form = document.getElementById("configForm");

  const fields = {
    fallbackEnabled: document.getElementById("fallbackEnabled"),
    tipoRevisao: document.getElementById("tipoRevisao"),
    tipoDenuncia: document.getElementById("tipoDenuncia"),
    tipoBanHack: document.getElementById("tipoBanHack"),
    tipoBan: document.getElementById("tipoBan"),
    tagsRevisao: document.getElementById("tagsRevisao"),
    tagsDenuncia: document.getElementById("tagsDenuncia"),
    tagsBanHack: document.getElementById("tagsBanHack"),
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
  fields.tipoRevisao.checked = config.enabledMetaTypes.REVISAO;
  fields.tipoDenuncia.checked = config.enabledMetaTypes.DENUNCIA;
  fields.tipoBanHack.checked = config.enabledMetaTypes.BAN_HACK;
  fields.tipoBan.checked = config.enabledMetaTypes.BAN;

  fields.tagsRevisao.value = arrayToLines(config.fallbackTags.REVISAO);
  fields.tagsDenuncia.value = arrayToLines(config.fallbackTags.DENUNCIA);
  fields.tagsBanHack.value = arrayToLines(config.fallbackTags.BAN_HACK);
  fields.tagsBan.value = arrayToLines(config.fallbackTags.BAN);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      metaFallbackEnabled: fields.fallbackEnabled.checked,
      enabledMetaTypes: {
        REVISAO: fields.tipoRevisao.checked,
        DENUNCIA: fields.tipoDenuncia.checked,
        BAN_HACK: fields.tipoBanHack.checked,
        BAN: fields.tipoBan.checked
      },
      fallbackTags: {
        REVISAO: linesToArray(fields.tagsRevisao.value),
        DENUNCIA: linesToArray(fields.tagsDenuncia.value),
        BAN_HACK: linesToArray(fields.tagsBanHack.value),
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
      app.showToast("Erro", error.message || "Falha ao salvar configurações.", "error");
    }
  });
})();

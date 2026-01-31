const app = (() => {
  const state = {
    user: null,
    prefs: null
  };

  const PREFS_LAST_USER_KEY = "revoada_ui_last_user";
  const PREFS_DEFAULT_KEY = "revoada_ui_prefs:default";
  const METAS_MONTH_KEY = "revoada_metas_mes";

  function ensureToastContainer() {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(title, message, type = "info") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`.trim();
    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      <div>${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (data && (data.message || data.error)) || "Erro inesperado.";
      showToast("Falha", typeof message === "string" ? message : "Erro inesperado.", "error");
      throw new Error(typeof message === "string" ? message : "Erro inesperado.");
    }
    return data;
  }

  function prefsKey(userId) {
    return userId ? `revoada_ui_prefs:${userId}` : PREFS_DEFAULT_KEY;
  }

  function parsePrefs(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function normalizePrefs(prefs) {
    const theme = prefs?.theme === "dark" ? "dark" : "light";
    let fontScale = Number(prefs?.fontScale || 1);
    if (Number.isNaN(fontScale) || fontScale <= 0) fontScale = 1;
    const density = prefs?.density === "compact" ? "compact" : "comfortable";
    return {
      theme,
      fontScale,
      density,
      updatedAt: prefs?.updatedAt || Date.now()
    };
  }

  function getSystemFallbackPrefs() {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return {
      theme: prefersDark ? "dark" : "light",
      fontScale: 1,
      density: "comfortable",
      updatedAt: Date.now()
    };
  }

  function readPrefs(userId) {
    const raw = localStorage.getItem(prefsKey(userId));
    const parsed = parsePrefs(raw);
    if (parsed) return normalizePrefs(parsed);

    const fallbackRaw = localStorage.getItem(PREFS_DEFAULT_KEY);
    const fallback = parsePrefs(fallbackRaw);
    if (fallback) return normalizePrefs(fallback);

    return normalizePrefs(getSystemFallbackPrefs());
  }

  function hasPrefs(userId) {
    return Boolean(localStorage.getItem(prefsKey(userId)));
  }

  function writePrefs(userId, prefs) {
    const normalized = normalizePrefs(prefs);
    localStorage.setItem(prefsKey(userId), JSON.stringify(normalized));
    if (userId) {
      localStorage.setItem(PREFS_LAST_USER_KEY, userId);
    }
    return normalized;
  }

  function applyPreferences(prefs) {
    const normalized = normalizePrefs(prefs);
    document.documentElement.setAttribute("data-theme", normalized.theme);
    document.documentElement.style.setProperty("--font-scale", normalized.fontScale);
    const densityPx = normalized.density === "compact" ? "8px" : "14px";
    document.documentElement.style.setProperty("--density", densityPx);
    state.prefs = normalized;
  }

  function getSelectedMonth() {
    return localStorage.getItem(METAS_MONTH_KEY) || "atual";
  }

  function setSelectedMonth(value) {
    const normalized = value || "atual";
    localStorage.setItem(METAS_MONTH_KEY, normalized);
    return normalized;
  }

  function syncPreferenceControls() {
    const themeToggle = document.querySelector("#themeToggle");
    if (themeToggle) {
      themeToggle.checked = state.prefs?.theme === "dark";
    }

    const themeSelect = document.querySelector("#themeSelect");
    if (themeSelect) {
      themeSelect.value = state.prefs?.theme || "light";
    }

    const fontSlider = document.querySelector("#fontSlider");
    if (fontSlider) {
      fontSlider.value = state.prefs?.fontScale || 1;
    }

    const densitySelect = document.querySelector("#densitySelect");
    if (densitySelect) {
      densitySelect.value = state.prefs?.density || "comfortable";
    }
  }

  function initSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    const toggle = document.querySelector(".mobile-toggle");
    if (!sidebar || !overlay || !toggle) return;

    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(".nav a").forEach((link) => {
      if (link.dataset.page === page) {
        link.classList.add("active");
      }
    });
  }

  async function loadUser() {
    if (document.body.dataset.public) {
      return;
    }
    const mockEnabled = localStorage.getItem("revoada_mock_login") === "true";
    if (mockEnabled) {
      const mockUser = {
        id: localStorage.getItem("revoada_mock_user_id") || "mock-user",
        username: localStorage.getItem("revoada_mock_user_name") || "Mock Staff",
        avatar: null,
        roles: []
      };
      state.user = mockUser;
      localStorage.setItem(PREFS_LAST_USER_KEY, mockUser.id);
      const prefs = readPrefs(mockUser.id);
      applyPreferences(prefs);
      syncPreferenceControls();
      const chip = document.querySelector(".user-chip");
      if (chip) {
        chip.innerHTML = `
          <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Avatar" />
          <div>
            <div>${mockUser.username}</div>
            <div style="font-size:0.8rem;color:var(--muted)">MODO TESTE</div>
          </div>
          <a href="login.html" style="margin-left:auto;color:var(--danger);font-size:0.85rem" id="mockLogout">Sair</a>
        `;
        const mockLogout = document.getElementById("mockLogout");
        if (mockLogout) {
          mockLogout.addEventListener("click", () => {
            localStorage.removeItem("revoada_mock_login");
            localStorage.removeItem("revoada_mock_user_id");
            localStorage.removeItem("revoada_mock_user_name");
          });
        }
      }
      return;
    }

    try {
      const data = await apiFetch("/api/me");
      state.user = data.user;
      localStorage.setItem(PREFS_LAST_USER_KEY, data.user.id);

      const defaultPrefs = readPrefs(null);
      if (!hasPrefs(data.user.id) && defaultPrefs) {
        writePrefs(data.user.id, defaultPrefs);
      }
      const prefs = readPrefs(data.user.id);
      applyPreferences(prefs);
      syncPreferenceControls();

      const chip = document.querySelector(".user-chip");
      if (chip) {
        const avatar = data.user.avatar
          ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
          : "https://cdn.discordapp.com/embed/avatars/0.png";
        chip.innerHTML = `
          <img src="${avatar}" alt="Avatar" />
          <div>
            <div>${data.user.username}</div>
            <div style="font-size:0.8rem;color:var(--muted)">STAFF</div>
          </div>
          <a href="api/auth/logout" style="margin-left:auto;color:var(--danger);font-size:0.85rem">Sair</a>
        `;
      }
    } catch (error) {
      if (!document.body.dataset.public) {
        window.location.href = "login.html";
      }
    }
  }

  function bindPreferencesControls() {
    const themeToggle = document.querySelector("#themeToggle");
    if (themeToggle) {
      themeToggle.checked = document.documentElement.getAttribute("data-theme") === "dark";
      themeToggle.addEventListener("change", (event) => {
        const theme = event.target.checked ? "dark" : "light";
        const prefs = writePrefs(state.user?.id, { ...state.prefs, theme });
        applyPreferences(prefs);
        syncPreferenceControls();
      });
    }

    const themeSelect = document.querySelector("#themeSelect");
    if (themeSelect) {
      themeSelect.value = state.prefs?.theme || "light";
      themeSelect.addEventListener("change", (event) => {
        const theme = event.target.value === "dark" ? "dark" : "light";
        const prefs = writePrefs(state.user?.id, { ...state.prefs, theme });
        applyPreferences(prefs);
        syncPreferenceControls();
      });
    }

    const fontSlider = document.querySelector("#fontSlider");
    if (fontSlider) {
      fontSlider.value = state.prefs?.fontScale || 1;
      fontSlider.addEventListener("input", (event) => {
        const fontScale = Number(event.target.value);
        const prefs = writePrefs(state.user?.id, { ...state.prefs, fontScale });
        applyPreferences(prefs);
        syncPreferenceControls();
      });
    }

    const densitySelect = document.querySelector("#densitySelect");
    if (densitySelect) {
      densitySelect.value = state.prefs?.density || "comfortable";
      densitySelect.addEventListener("change", (event) => {
        const density = event.target.value === "compact" ? "compact" : "comfortable";
        const prefs = writePrefs(state.user?.id, { ...state.prefs, density });
        applyPreferences(prefs);
        syncPreferenceControls();
      });
    }
  }

  function init() {
    const lastUserId = localStorage.getItem(PREFS_LAST_USER_KEY);
    const prefs = readPrefs(lastUserId);
    applyPreferences(prefs);

    initSidebar();
    setActiveNav();
    bindPreferencesControls();
    loadUser();
  }

  return {
    init,
    apiFetch,
    showToast,
    state,
    applyPreferences,
    readPrefs,
    writePrefs,
    prefsKey,
    PREFS_LAST_USER_KEY,
    getSelectedMonth,
    setSelectedMonth
  };
})();

document.addEventListener("DOMContentLoaded", () => app.init());

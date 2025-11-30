/*******************************************************
 *  SCRIPT.JS — NEW ARCHITECTURE (OPTION B)
 *  WAVE 3 — PART 1
 *******************************************************/

/* -----------------------------------------------------
   GLOBAL APP STATE
----------------------------------------------------- */
const AppState = {
  souls: [],
  homies: [],
  domains: [],
  abilities: [],

  lastGeneratedAbility: null,
  lastGeneratedLairGroup: null,

  ui: {
    activePanel: 1,
    activeDropdown: null
  }
};


/* -----------------------------------------------------
   STORAGE MANAGER
----------------------------------------------------- */
const Storage = {
  save() {
    localStorage.setItem("SOUL_APP", JSON.stringify(AppState));
  },

  load() {
    const raw = localStorage.getItem("SOUL_APP");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      AppState.souls = data.souls || [];
      AppState.homies = data.homies || [];
      AppState.domains = data.domains || [];
      AppState.abilities = data.abilities || [];

      AppState.lastGeneratedAbility = data.lastGeneratedAbility || null;
      AppState.lastGeneratedLairGroup = data.lastGeneratedLairGroup || null;

    } catch (err) {
      console.error("Failed to load storage:", err);
    }
  },

  reset() {
    localStorage.removeItem("SOUL_APP");
    location.reload();
  }
};


/* -----------------------------------------------------
   UTILITY HELPERS
----------------------------------------------------- */

function uuid() {
  return "_" + Math.random().toString(36).substring(2, 11);
}

function byId(id) {
  return document.getElementById(id);
}

function clamp(num, min, max) {
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
}

/* Auto-expand textareas globally */
function autoResizeTextareas() {
  document.querySelectorAll("textarea").forEach(t => {
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";

    t.addEventListener("input", () => {
      t.style.height = "auto";
      t.style.height = t.scrollHeight + "px";
    });
  });
}


/* -----------------------------------------------------
   ERROR BANNER CONTROLLER
----------------------------------------------------- */
const ErrorBanner = {
  el: null,
  text: null,
  closeBtn: null,
  hideTimeout: null,

  init() {
    this.el = byId("app-error-banner");
    this.text = byId("app-error-text");
    this.closeBtn = byId("app-error-close");

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }
  },

  show(message) {
    if (!this.el || !this.text) return;

    this.text.textContent = message;
    this.el.classList.remove("hidden");

    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => this.hide(), 4000);
  },

  hide() {
    if (!this.el) return;
    this.el.classList.add("hidden");
  }
};


/* -----------------------------------------------------
   PANEL SWITCHER
----------------------------------------------------- */
function initPanelButtons() {
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = Number(btn.dataset.panel);
      showPanel(panel);
    });
  });
}

function showPanel(panelNum) {
  AppState.ui.activePanel = panelNum;

  document.querySelectorAll(".panel").forEach(p => {
    const isMatch = Number(p.dataset.panel) === panelNum;
    p.classList.toggle("active", isMatch);
  });

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.panel) === panelNum);
  });

  rerender();
}


/* -----------------------------------------------------
   COLLAPSE / DROPDOWN SYSTEM FOR PLAYABLE VIEW
----------------------------------------------------- */
function toggleCollapse(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const active = el.classList.contains("active");

  // Close previously opened dropdown
  if (AppState.ui.activeDropdown && AppState.ui.activeDropdown !== id) {
    const prev = document.getElementById(AppState.ui.activeDropdown);
    if (prev) prev.classList.remove("active");
  }

  if (active) {
    el.classList.remove("active");
    AppState.ui.activeDropdown = null;
  } else {
    el.classList.add("active");
    AppState.ui.activeDropdown = id;
  }
}


/* -----------------------------------------------------
   CORE RERENDER FUNCTION
----------------------------------------------------- */
function rerender() {

  // Panel 1
  if (AppState.ui.activePanel === 1) {
    renderSoulsPanel();
  }

  // Panel 2
  if (AppState.ui.activePanel === 2) {
    renderHomiesPanel();
  }

  // Panel 3
  if (AppState.ui.activePanel === 3) {
    renderAbilitiesPanel();
  }

  // Panel 4
  if (AppState.ui.activePanel === 4) {
    renderDomainsPanel();
  }

  // Panel 5
  if (AppState.ui.activePanel === 5) {
    renderPlayablePanel();
  }

  Storage.save();
}


/* -----------------------------------------------------
   INITIALIZATION
----------------------------------------------------- */
function init() {
  Storage.load();
  ErrorBanner.init();
  initPanelButtons();
  autoResizeTextareas();

  showPanel(AppState.ui.activePanel || 1);
}

document.addEventListener("DOMContentLoaded", init);

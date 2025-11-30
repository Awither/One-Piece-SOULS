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
/*******************************************************
 *  SCRIPT.JS — NEW ARCHITECTURE (OPTION B)
 *  WAVE 3 — PART 2
 *  COMPONENT RENDERERS
 *******************************************************/


/* -----------------------------------------------------
   ABILITY CARD RENDERER (Matches Your Reference)
----------------------------------------------------- */
function renderAbilityCard(ability, { compact = false, rerollable = false, onReroll = null } = {}) {
  const card = document.createElement("div");
  card.className = compact ? "ability-card compact" : "ability-card";

  card.innerHTML = `
    <div class="ability-card-header">
      <div class="ability-name">${ability.name || "Unnamed Ability"}</div>
      <div class="ability-power">Pwr ${ability.power || "-"}</div>
    </div>

    <div class="ability-description">
      ${ability.description || ""}
    </div>

    <div class="ability-divider"></div>

    <div class="ability-grid">
      <div><strong>Action:</strong> ${ability.action || "-"}</div>
      <div><strong>Range:</strong> ${ability.range || "-"}</div>
      <div><strong>Target:</strong> ${ability.target || "-"}</div>
      <div><strong>Save:</strong> ${ability.save || "-"}</div>
      <div><strong>DC:</strong> ${ability.dc || "-"}</div>
      <div><strong>Damage:</strong> ${ability.damage || "-"}</div>
    </div>

    <div class="ability-divider"></div>

    <div class="ability-effect">
      ${ability.effect || ""}
    </div>

    ${ability.combo ? `
      <div class="ability-divider"></div>
      <div class="ability-combo">
        <strong>Combo:</strong> ${ability.combo}
      </div>
    ` : ""}

    <div class="ability-card-actions">
      <button class="btn-secondary copy-btn">Copy</button>
      <button class="btn-secondary delete-btn">Delete</button>
      ${rerollable ? `<button class="btn-primary reroll-btn">Reroll</button>` : ""}
    </div>
  `;

  // Copy ability JSON
  card.querySelector(".copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(JSON.stringify(ability, null, 2));
    ErrorBanner.show("Copied ✓");
  });

  // Delete ability
  card.querySelector(".delete-btn").addEventListener("click", () => {
    AppState.abilities = AppState.abilities.filter(a => a.id !== ability.id);
    rerender();
  });

  // Reroll AI action
  if (rerollable && onReroll) {
    card.querySelector(".reroll-btn").addEventListener("click", () => onReroll(ability));
  }

  return card;
}


/* -----------------------------------------------------
   LAIR ACTION CARD RENDERER
----------------------------------------------------- */
function renderLairActionCard(actionObj) {
  const card = document.createElement("div");
  card.className = "ability-card";

  card.innerHTML = `
    <div class="ability-card-header">
      <div class="ability-name">${actionObj.name || "Lair Action"}</div>
      <div class="ability-power">Pwr ${actionObj.power || "-"}</div>
    </div>

    <div class="ability-description">${actionObj.description || ""}</div>

    <div class="ability-divider"></div>

    <div class="ability-effect">${actionObj.effect || ""}</div>

    <div class="ability-card-actions">
      <button class="btn-secondary delete-btn">Delete</button>
    </div>
  `;

  // Delete from domain
  card.querySelector(".delete-btn").addEventListener("click", () => {
    const domain = AppState.domains.find(d => d.id === actionObj.domainId);
    if (!domain) return;

    domain.lairActions = domain.lairActions.filter(l => l.id !== actionObj.id);
    rerender();
  });

  return card;
}


/* -----------------------------------------------------
   SOUL CARD RENDERER
----------------------------------------------------- */
function renderSoulListCard(soul) {
  const div = document.createElement("div");
  div.className = "list-card";

  div.innerHTML = `
    <h4>${soul.name}</h4>
    <p><strong>Rating:</strong> ${soul.rating}</p>
    <p><strong>SoL:</strong> ${soul.level}</p>
    <p><strong>SPU:</strong> ${soul.spu}</p>
    <p><strong>Tags:</strong> ${soul.tags || "-"}</p>
    <button class="btn-secondary delete-btn">Delete</button>
  `;

  div.querySelector(".delete-btn").addEventListener("click", () => {
    AppState.souls = AppState.souls.filter(s => s.id !== soul.id);
    rerender();
  });

  return div;
}


/* -----------------------------------------------------
   HOMIE CARD RENDERER
----------------------------------------------------- */
function renderHomieListCard(homie) {
  const div = document.createElement("div");
  div.className = "list-card";

  div.innerHTML = `
    <h4>${homie.name}</h4>

    <p><strong>Type:</strong> ${homie.type}</p>
    <p><strong>SPU:</strong> ${homie.spu}</p>
    <p><strong>HP:</strong> ${homie.hp}, <strong>AC:</strong> ${homie.ac}</p>
    <p><strong>Move:</strong> ${homie.move}</p>

    <p><strong>Role:</strong> ${homie.role}</p>
    <p><strong>Personality:</strong> ${homie.personality}</p>

    <button class="btn-secondary delete-btn">Delete</button>
  `;

  div.querySelector(".delete-btn").addEventListener("click", () => {
    AppState.homies = AppState.homies.filter(h => h.id !== homie.id);
    rerender();
  });

  return div;
}


/* -----------------------------------------------------
   DOMAIN CARD RENDERER
----------------------------------------------------- */
function renderDomainListCard(domain) {
  const div = document.createElement("div");
  div.className = "list-card";

  div.innerHTML = `
    <h4>${domain.name}</h4>
    <p><strong>SPU:</strong> ${domain.spu}</p>
    <p>${domain.description || ""}</p>

    <p><strong>Lair Actions:</strong> ${domain.lairActions?.length || 0}</p>

    <button class="btn-secondary delete-btn">Delete</button>
  `;

  div.querySelector(".delete-btn").addEventListener("click", () => {
    AppState.domains = AppState.domains.filter(d => d.id !== domain.id);
    rerender();
  });

  return div;
}


/* -----------------------------------------------------
   PLAYABLE VIEW — COLLAPSIBLE BOX
----------------------------------------------------- */
function createPlayableCollapse(title, id) {
  const wrapper = document.createElement("div");
  wrapper.className = "playable-wrapper";

  wrapper.innerHTML = `
    <button class="collapse-btn" data-collapse="${id}">
      ${title}
    </button>
    <div class="collapse-content" id="${id}"></div>
  `;

  // Hook collapse button
  wrapper.querySelector(".collapse-btn").addEventListener("click", () => {
    toggleCollapse(id);
  });

  return wrapper;
}


/* -----------------------------------------------------
   GENERIC LIST POPULATOR
----------------------------------------------------- */
function populateList(el, items, renderer) {
  el.innerHTML = "";
  items.forEach(item => el.appendChild(renderer(item)));
}
/*******************************************************
 *  SCRIPT.JS — WAVE 3 PART 3A
 *  PANEL RENDERERS + CREATION LOGIC
 *******************************************************/


/* -----------------------------------------------------
   PANEL 1 — SOULS
----------------------------------------------------- */
function renderSoulsPanel() {
  const listEl = byId("soulBankList");
  const search = byId("soulSearch").value.toLowerCase();

  const filtered = AppState.souls.filter(s =>
    !search || s.name.toLowerCase().includes(search)
  );

  populateList(listEl, filtered, renderSoulListCard);
}


/* Recalculate soul rating */
function calcSoulRating() {
  const might = clamp(parseInt(byId("soulMight").value), 1, 10);
  const tier = clamp(parseInt(byId("soulTier").value), 0, 9);
  const will = clamp(parseInt(byId("soulWill").value), 1, 10);

  const combined = (might * 2) + (tier * 3) + (will * 5);
  const sol = Math.max(1, Math.floor(combined / 10));
  const spu = Math.floor(combined * 8.5);
  const hp = Math.floor(sol * 2);

  byId("soulRatingValue").textContent = combined;
  byId("soulLevelValue").textContent = sol;
  byId("soulSPUValue").textContent = spu;
  byId("soulHPValue").textContent = hp;

  return { combined, sol, spu, hp };
}


/* Add soul */
function createSoul() {
  const name = byId("soulName").value.trim();
  if (!name) return ErrorBanner.show("Soul needs a name.");

  const stats = calcSoulRating();

  const soul = {
    id: uuid(),
    name,
    rating: stats.combined,
    level: stats.sol,
    spu: stats.spu,
    hp: stats.hp,
    tags: byId("soulTags").value.trim(),
    notes: byId("soulNotes").value.trim()
  };

  AppState.souls.push(soul);
  ErrorBanner.show("Soul added ✓");

  rerender();
  populateSoulLinkedDropdowns();
}


/* -----------------------------------------------------
   PANEL 2 — HOMIES
----------------------------------------------------- */
function renderHomiesPanel() {
  const listEl = byId("homieRosterList");
  const search = byId("homieSearch").value.toLowerCase();

  const filtered = AppState.homies.filter(h =>
    !search || h.name.toLowerCase().includes(search)
  );

  populateList(listEl, filtered, renderHomieListCard);
}


/* Create Homie */
function createHomie() {
  const name = byId("homieName").value.trim();
  if (!name) return ErrorBanner.show("Homie needs a name.");

  const homie = {
    id: uuid(),
    name,
    type: byId("homieType").value.trim(),
    linkedSoul: byId("homieLinkedSoul").value || null,
    spu: clamp(parseInt(byId("homieSPU").value), 0, 999999),

    hp: clamp(parseInt(byId("homieHP").value), 1, 9999),
    ac: clamp(parseInt(byId("homieAC").value), 1, 999),

    move: byId("homieMove").value.trim(),
    damage: byId("homieDamage").value.trim(),

    role: byId("homieRole").value.trim(),
    personality: byId("homiePersonality").value.trim(),

    attacks: []  // AI-generated abilities tied to this homie
  };

  AppState.homies.push(homie);
  ErrorBanner.show("Homie created ✓");

  rerender();
}


/* -----------------------------------------------------
   PANEL 3 — ABILITIES (Manual + AI)
----------------------------------------------------- */
function renderAbilitiesPanel() {
  const container = byId("abilityList");
  container.innerHTML = "";

  AppState.abilities.forEach(ab => {
    container.appendChild(
      renderAbilityCard(ab, {
        compact: false,
        rerollable: true,
        onReroll: (ability) => aiRerollAbility(ability)
      })
    );
  });
}


/* Manual ability creation */
function createManualAbility() {
  const name = byId("manualAbilityName").value.trim();
  const desc = byId("manualAbilityDesc").value.trim();
  const power = clamp(parseInt(byId("manualAbilityPower").value), 1, 10);

  if (!name || !desc) {
    return ErrorBanner.show("Manual ability needs name + description.");
  }

  const ab = {
    id: uuid(),
    name,
    description: desc,
    power,
    action: "-",
    range: "-",
    target: "-",
    save: "-",
    dc: "-",
    damage: "-",
    effect: desc,
    combo: ""
  };

  AppState.abilities.push(ab);
  ErrorBanner.show("Ability saved ✓");
  rerender();
}


/* -----------------------------------------------------
   PANEL 4 — DOMAINS + LAIR ACTIONS
----------------------------------------------------- */
function renderDomainsPanel() {
  const listEl = byId("lairActionList");
  const domainList = byId("domainListContainer");

  /* Populate domain list (upper section) */
  const domainContainer = byId("domainListContainer");
  if (domainContainer) {
    domainContainer.innerHTML = "";
    AppState.domains.forEach(d => {
      domainContainer.appendChild(renderDomainListCard(d));
    });
  }

  /* Populate lair action cards (lower section) */
  listEl.innerHTML = "";
  AppState.domains.forEach(domain => {
    if (!domain.lairActions) domain.lairActions = [];
    domain.lairActions.forEach(action => {
      listEl.appendChild(renderLairActionCard(action));
    });
  });

  populateLairDomainDropdown();
}


/* Create Domain */
function createDomain() {
  const name = byId("domainName").value.trim();
  if (!name) return ErrorBanner.show("Domain needs a name.");

  const domain = {
    id: uuid(),
    name,
    spu: clamp(parseInt(byId("domainSPU").value), 0, 999999),
    description: byId("domainDescription").value.trim(),
    lairActions: []
  };

  AppState.domains.push(domain);
  ErrorBanner.show("Domain created ✓");
  rerender();
}


/* -----------------------------------------------------
   PANEL 5 — PLAYABLE VIEW
----------------------------------------------------- */
function renderPlayablePanel() {
  /* HOMIES */
  const homieWrap = byId("playableHomies");
  homieWrap.innerHTML = "";

  AppState.homies.forEach(h => {
    const collapse = createPlayableCollapse(`${h.name} (HP ${h.hp}, AC ${h.ac})`, `homie-${h.id}`);
    const content = collapse.querySelector(".collapse-content");

    /* Add homie attacks */
    h.attacks.forEach(atk => {
      content.appendChild(renderAbilityCard(atk, { compact: true }));
    });

    homieWrap.appendChild(collapse);
  });

  /* DOMAINS */
  const domainWrap = byId("playableDomains");
  domainWrap.innerHTML = "";

  AppState.domains.forEach(d => {
    const collapse = createPlayableCollapse(`${d.name}`, `domain-${d.id}`);
    const content = collapse.querySelector(".collapse-content");

    d.lairActions?.forEach(act => {
      content.appendChild(renderLairActionCard(act));
    });

    domainWrap.appendChild(collapse);
  });

  /* ABILITIES */
  const abilityWrap = byId("playableAbilities");
  abilityWrap.innerHTML = "";

  AppState.abilities.forEach(a => {
    abilityWrap.appendChild(renderAbilityCard(a, { compact: true }));
  });
}


/* -----------------------------------------------------
   DROPDOWN POPULATORS
----------------------------------------------------- */
function populateSoulLinkedDropdowns() {
  /* Homie linked soul dropdown */
  const sel = byId("homieLinkedSoul");
  sel.innerHTML = `<option value="">None</option>`;

  AppState.souls.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}

function populateLairDomainDropdown() {
  const sel = byId("lairDomainSelect");
  sel.innerHTML = "";

  AppState.domains.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}
/*******************************************************
 *  SCRIPT.JS — WAVE 3 PART 3B
 *  AI MANAGER + REROLL ENGINE + EVENT LISTENERS
 *******************************************************/


/* -----------------------------------------------------
   AI MANAGER (Unified Fetch Wrapper)
----------------------------------------------------- */
async function callAI(payload) {
  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("AI request failed.");

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "AI failed.");

    return data.text;
  } catch (err) {
    console.error(err);
    ErrorBanner.show("AI Error: " + err.message);
    return null;
  }
}


/* -----------------------------------------------------
   ABILITY PARSER
   Converts raw AI text → clean ability object
----------------------------------------------------- */
function parseAbilityText(rawText, power) {
  // Basic extraction heuristics
  const get = (label) => {
    const match = rawText.match(new RegExp(`${label}:\\s*(.*)`, "i"));
    return match ? match[1].trim() : "-";
  };

  return {
    id: uuid(),
    name: get("Name"),
    description: get("Description") !== "-" ? get("Description") : rawText,

    power,

    action: get("Action"),
    range: get("Range"),
    target: get("Target"),
    save: get("Save"),
    dc: get("DC"),
    damage: get("Damage"),
    effect: get("Effect"),
    combo: get("Combo")
  };
}


/* -----------------------------------------------------
   LAIR ACTION PARSER
----------------------------------------------------- */
function parseLairAction(rawText, power, domainId) {
  const get = (label) => {
    const match = rawText.match(new RegExp(`${label}:\\s*(.*)`, "i"));
    return match ? match[1].trim() : "";
  };

  return {
    id: uuid(),
    domainId,
    power,
    name: get("Name") || "Lair Action",
    description: get("Description") || rawText,
    effect: get("Effect") || ""
  };
}


/* -----------------------------------------------------
   AI — GENERATE ABILITY
----------------------------------------------------- */
async function aiGenerateAbility() {
  const prompt = byId("aiAbilityPrompt").value.trim();
  const role = byId("aiAbilityRole").value;
  const power = clamp(parseInt(byId("aiAbilityPower").value), 1, 10);

  if (!prompt) return ErrorBanner.show("Describe an ability first.");

  const text = await callAI({
    mode: "genericAbility",
    prompt,
    role,
    power,
    souls: AppState.souls,
    homies: AppState.homies,
    domains: AppState.domains
  });

  if (!text) return;

  const ability = parseAbilityText(text, power);
  AppState.abilities.push(ability);
  AppState.lastGeneratedAbility = ability;

  byId("rerollAbilityBtn").disabled = false;

  ErrorBanner.show("AI Ability Generated ✓");
  rerender();
}


/* -----------------------------------------------------
   AI — REROLL ABILITY
----------------------------------------------------- */
async function aiRerollAbility(ability) {
  if (!ability) return;

  const text = await callAI({
    mode: "genericAbility",
    prompt: ability.description || ability.effect || "",
    role: "Offense",
    power: ability.power,
    souls: AppState.souls,
    homies: AppState.homies,
    domains: AppState.domains
  });

  if (!text) return;

  const updated = parseAbilityText(text, ability.power);

  // Replace in state
  const index = AppState.abilities.findIndex(a => a.id === ability.id);
  AppState.abilities[index] = updated;

  ErrorBanner.show("Ability Rerolled ✓");
  rerender();
}


/* -----------------------------------------------------
   AI — GENERATE LAIR ACTIONS
----------------------------------------------------- */
async function aiGenerateLairActions() {
  const domainId = byId("lairDomainSelect").value;
  const power = clamp(parseInt(byId("lairPower").value), 1, 10);
  const count = clamp(parseInt(byId("lairCount").value), 1, 6);

  const domain = AppState.domains.find(d => d.id === domainId);
  if (!domain) return ErrorBanner.show("Select a domain.");

  const text = await callAI({
    mode: "domainLair",
    domain,
    power,
    count
  });

  if (!text) return;

  const lines = text.split(/\n+/).filter(l => l.trim().length > 0);

  const actions = lines.map(line => parseLairAction(line, power, domain.id));

  domain.lairActions = [...(domain.lairActions || []), ...actions];
  AppState.lastGeneratedLairGroup = { domainId, power, count };

  byId("rerollLairBtn").disabled = false;

  ErrorBanner.show("Lair Actions Generated ✓");
  rerender();
}


/* -----------------------------------------------------
   AI — REROLL LAIR ACTIONS
----------------------------------------------------- */
async function aiRerollLairActions() {
  const info = AppState.lastGeneratedLairGroup;
  if (!info) return ErrorBanner.show("No lair action to reroll.");

  const domain = AppState.domains.find(d => d.id === info.domainId);
  if (!domain) return;

  const text = await callAI({
    mode: "domainLair",
    domain,
    power: info.power,
    count: info.count
  });

  if (!text) return;

  const lines = text.split(/\n+/).filter(l => l.trim().length > 0);
  const actions = lines.map(line => parseLairAction(line, info.power, domain.id));

  domain.lairActions = actions;
  ErrorBanner.show("Lair Actions Rerolled ✓");

  rerender();
}


/* -----------------------------------------------------
   EVENT LISTENERS — FORM ACTIONS
----------------------------------------------------- */

/* PANEL 1 */
byId("calcSoulBtn").addEventListener("click", calcSoulRating);
byId("addSoulBtn").addEventListener("click", createSoul);
byId("soulSearch").addEventListener("input", rerender);

/* PANEL 2 */
byId("createHomieBtn").addEventListener("click", createHomie);
byId("homieSearch").addEventListener("input", rerender);

/* PANEL 3 */
byId("saveManualAbilityBtn").addEventListener("click", createManualAbility);
byId("generateAbilityBtn").addEventListener("click", aiGenerateAbility);
byId("rerollAbilityBtn").addEventListener("click", () => {
  aiRerollAbility(AppState.lastGeneratedAbility);
});

/* PANEL 4 */
byId("saveDomainBtn").addEventListener("click", createDomain);
byId("generateLairBtn").addEventListener("click", aiGenerateLairActions);
byId("rerollLairBtn").addEventListener("click", aiRerollLairActions);

/* PANEL 5 — Nothing to wire (auto-rendered) */


/* Final dropdown refresh */
populateSoulLinkedDropdowns();
populateLairDomainDropdown();

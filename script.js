/* ============================================================
   Soul-Soul Fruit Workshop — Master Script
   Handles:
   - Error UI
   - Auto-growing textareas
   - Soul Rating + Soul Bank
   - Homie creation, roster, AI attack generation
   - Domain creation & overview
   - Ability creation (manual + AI)
   - LocalStorage sync
   - API communication
   ============================================================ */

/* ============================================================
   ERROR HANDLER
   ============================================================ */

const errorBanner = document.getElementById("app-error-banner");
const errorText = document.getElementById("app-error-text");
const errorClose = document.getElementById("app-error-close");

function showError(message, err = null) {
  console.error("[Soul-Soul Workshop Error]", message, err || "");

  errorText.textContent = message;
  errorBanner.classList.remove("hidden");

  setTimeout(() => {
    errorBanner.classList.add("hidden");
  }, 5000);
}

errorClose.addEventListener("click", () => {
  errorBanner.classList.add("hidden");
});

/* ============================================================
   AUTO-EXPANDING TEXTAREAS
   ============================================================ */

function autoExpand(el) {
  el.style.height = "auto";
  el.style.height = (el.scrollHeight + 2) + "px";
}

document.querySelectorAll("textarea").forEach(t => {
  autoExpand(t);
  t.addEventListener("input", () => autoExpand(t));
});

/* ============================================================
   LOCAL STORAGE STATE
   ============================================================ */

let Souls = [];
let Homies = [];
let Domains = [];
let Abilities = [];

function saveAll() {
  localStorage.setItem("Souls", JSON.stringify(Souls));
  localStorage.setItem("Homies", JSON.stringify(Homies));
  localStorage.setItem("Domains", JSON.stringify(Domains));
  localStorage.setItem("Abilities", JSON.stringify(Abilities));
}

function loadAll() {
  Souls = JSON.parse(localStorage.getItem("Souls") || "[]");
  Homies = JSON.parse(localStorage.getItem("Homies") || "[]");
  Domains = JSON.parse(localStorage.getItem("Domains") || "[]");
  Abilities = JSON.parse(localStorage.getItem("Abilities") || "[]");
}

loadAll();

/* ============================================================
   HELPERS
   ============================================================ */

function uuid() {
  return "_" + Math.random().toString(36).substring(2, 10);
}

/* ============================================================
   ========= PANEL 1 — SOUL RATING + SOUL BANK ================
   ============================================================ */

const soulName = document.getElementById("soul-name");
const soulMight = document.getElementById("soul-might");
const soulTier = document.getElementById("soul-tier");
const soulWill = document.getElementById("soul-will");
const soulRating = document.getElementById("soul-rating");
const soulLevel = document.getElementById("soul-level");
const soulSpu = document.getElementById("soul-spu");
const soulHp = document.getElementById("soul-hp");
const soulTags = document.getElementById("soul-tags");
const soulNotes = document.getElementById("soul-notes");

const soulBankList = document.getElementById("soul-bank-list");
const soulFilter = document.getElementById("soul-filter");

function calculateSoul() {
  const might = parseInt(soulMight.value) || 0;
  const tier = parseInt(soulTier.value) || 0;
  const will = parseInt(soulWill.value) || 0;

  // Weighted formula
  const combined = (might * 2) + (tier * 3) + (will * 5);

  // Soul Level = combined scaled
  const SoL = Math.max(1, Math.floor(combined / 10));

  // SPU = strong scaling up to 1000+
  const SPU = Math.floor(combined * 8.5);

  const HP = Math.floor(SoL * 2);

  soulRating.textContent = combined;
  soulLevel.textContent = SoL;
  soulSpu.textContent = SPU;
  soulHp.textContent = HP;
}

document.getElementById("btn-recalc-soul").addEventListener("click", calculateSoul);

function renderSoulBank() {
  soulBankList.innerHTML = "";

  const filter = soulFilter.value.toLowerCase();

  Souls.filter(s =>
    s.name.toLowerCase().includes(filter) ||
    s.tags.toLowerCase().includes(filter)
  ).forEach(soul => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h4>${soul.name}</h4>
      <p><strong>SoL:</strong> ${soul.level}</p>
      <p><strong>SPU:</strong> ${soul.spu}</p>
      <p><strong>Tags:</strong> ${soul.tags}</p>
      <p><strong>Notes:</strong> ${soul.notes}</p>
      <button class="delete-soul">Delete</button>
    `;

    card.querySelector(".delete-soul").addEventListener("click", () => {
      Souls = Souls.filter(x => x.id !== soul.id);
      saveAll();
      renderSoulBank();
      refreshLinkedSoulDropdown();
    });

    soulBankList.appendChild(card);
  });
}

document.getElementById("btn-add-soul").addEventListener("click", () => {
  calculateSoul();

  const newSoul = {
    id: uuid(),
    name: soulName.value.trim(),
    might: parseInt(soulMight.value) || 0,
    tier: parseInt(soulTier.value) || 0,
    will: parseInt(soulWill.value) || 0,
    rating: parseInt(soulRating.textContent),
    level: parseInt(soulLevel.textContent),
    spu: parseInt(soulSpu.textContent),
    hp: parseInt(soulHp.textContent),
    tags: soulTags.value.trim(),
    notes: soulNotes.value.trim()
  };

  Souls.push(newSoul);
  saveAll();
  renderSoulBank();
  refreshLinkedSoulDropdown();
  showError("Soul added to bank ✓ (this is a success alert!)");
});

soulFilter.addEventListener("input", renderSoulBank);

/* ============================================================
   HELPERS TO KEEP DROPDOWNS SYNCED
   ============================================================ */

const homieLinkedSoul = document.getElementById("homie-linked-soul");
const homieDomain = document.getElementById("homie-domain");
const aiHomieTarget = document.getElementById("ai-homie-target");
const abilityTarget = document.getElementById("ability-target");
const domainHomiesSelect = document.getElementById("domain-homies");

function refreshLinkedSoulDropdown() {
  homieLinkedSoul.innerHTML = `<option value="">— None / Composite —</option>`;
  Souls.forEach(s =>
    homieLinkedSoul.innerHTML += `<option value="${s.id}">${s.name}</option>`
  );
}

function refreshHomieDropdowns() {
  homieDomain.innerHTML = `<option value="">— None yet —</option>`;
  aiHomieTarget.innerHTML = `<option value="">Select Homie</option>`;
  abilityTarget.innerHTML = `<option value="">General / Party</option>`;
  domainHomiesSelect.innerHTML = "";

  Homies.forEach(h => {
    homieDomain.innerHTML += `<option value="${h.id}">${h.name}</option>`;
    aiHomieTarget.innerHTML += `<option value="${h.id}">${h.name}</option>`;
    abilityTarget.innerHTML += `<option value="${h.id}">${h.name}</option>`;
    domainHomiesSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`;
  });
}

/* ============================================================
   ========== PANEL 2 — HOMIE CREATION =========================
   ============================================================ */

const homieName = document.getElementById("homie-name");
const homieType = document.getElementById("homie-type");
const homieSpu = document.getElementById("homie-spu");
const homieRole = document.getElementById("homie-role");
const homieHp = document.getElementById("homie-hp");
const homieAc = document.getElementById("homie-ac");
const homieMove = document.getElementById("homie-move");
const homieAttack = document.getElementById("homie-attack");
const homieAbilities = document.getElementById("homie-abilities");
const homiePersonality = document.getElementById("homie-personality");
const homieLocation = document.getElementById("homie-location");
const homieSupport = document.getElementById("homie-support");
const homieTerritory = document.getElementById("homie-territory-actions");

document.getElementById("btn-create-homie").addEventListener("click", () => {
  const linkedSoul = homieLinkedSoul.value;
  const domainAssigned = homieDomain.value;

  const h = {
    id: uuid(),
    name: homieName.value,
    type: homieType.value,
    spu: parseInt(homieSpu.value) || 0,
    role: homieRole.value,
    hp: homieHp.value,
    ac: homieAc.value,
    move: homieMove.value,
    attack: homieAttack.value,
    abilities: homieAbilities.value,
    personality: homiePersonality.value,
    location: homieLocation.value,
    support: homieSupport.value,
    territory: homieTerritory.value,
    linkedSoul,
    domain: domainAssigned
  };

  Homies.push(h);
  saveAll();
  renderHomies();
  refreshHomieDropdowns();

  showError("Homie created ✓ (success)", null);
});

const homieRoster = document.getElementById("homie-roster");
const homieFilter = document.getElementById("homie-filter");

function renderHomies() {
  homieRoster.innerHTML = "";
  const f = homieFilter.value.toLowerCase();

  Homies.filter(h => h.name.toLowerCase().includes(f)).forEach(h => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h4>${h.name}</h4>
      <p><strong>Type:</strong> ${h.type}</p>
      <p><strong>SPU invested:</strong> ${h.spu}</p>
      <p><strong>Role:</strong> ${h.role}</p>
      <p><strong>Abilities:</strong> ${h.abilities}</p>
      <button class="delete-homie">Delete</button>
    `;

    card.querySelector(".delete-homie").addEventListener("click", () => {
      Homies = Homies.filter(x => x.id !== h.id);
      saveAll();
      renderHomies();
      refreshHomieDropdowns();
    });

    homieRoster.appendChild(card);
  });
}

homieFilter.addEventListener("input", renderHomies);

/* ============================================================
   AI ATTACK GENERATION (HOMIES)
   ============================================================ */

async function generateHomieAttack() {
  const target = aiHomieTarget.value;
  const concept = document.getElementById("ai-homie-concept").value.trim();
  const power = parseInt(document.getElementById("ai-homie-power").value) || 1;

  if (!target) return showError("Please select a Homie for the AI attack.");
  if (!concept) return showError("Please describe the attack concept.");

  const types = [...document.querySelectorAll(".ai-homie-type:checked")]
                  .map(c => c.value);

  const payload = {
    mode: "homieAttack",
    targetHomieId: target,
    concept,
    power,
    types,
    homies: Homies,
    souls: Souls,
    domains: Domains
  };

  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("AI request failed: HTTP " + res.status);

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Unknown AI error");

    document.getElementById("ai-homie-output").textContent = data.text;

  } catch (err) {
    showError("Failed to generate Homie attack via AI.", err);
  }
}

document.getElementById("btn-generate-homie-attack")
  .addEventListener("click", generateHomieAttack);

/* ============================================================
   ========== PANEL 3 — DOMAIN CREATION =======================
   ============================================================ */

const domainName = document.getElementById("domain-name");
const domainTier = document.getElementById("domain-tier");
const domainSpu = document.getElementById("domain-spu");
const domainRange = document.getElementById("domain-range");
const domainDc = document.getElementById("domain-dc");
const domainPersonality = document.getElementById("domain-personality");
const domainLairs = document.getElementById("domain-lairs");
const domainNotes = document.getElementById("domain-notes");
const domainList = document.getElementById("domain-list");
const domainFilterBox = document.getElementById("domain-filter");

document.getElementById("btn-create-domain").addEventListener("click", () => {

  const assigned = [...domainHomiesSelect.selectedOptions].map(o => o.value);

  const d = {
    id: uuid(),
    name: domainName.value,
    tier: parseInt(domainTier.value),
    spu: parseInt(domainSpu.value),
    range: domainRange.value,
    dc: parseInt(domainDc.value),
    personality: domainPersonality.value,
    lairs: domainLairs.value,
    notes: domainNotes.value,
    homies: assigned
  };

  Domains.push(d);
  saveAll();
  renderDomains();

  showError("Domain created ✓ (success)");
});

function renderDomains() {
  domainList.innerHTML = "";
  const f = domainFilterBox.value.toLowerCase();

  Domains.filter(d => d.name.toLowerCase().includes(f)).forEach(d => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h4>${d.name}</h4>
      <p><strong>Tier:</strong> ${d.tier}</p>
      <p><strong>SPU:</strong> ${d.spu}</p>
      <p><strong>Fear DC:</strong> ${d.dc}</p>
      <p><strong>Range:</strong> ${d.range}</p>
      <p><strong>Personality:</strong> ${d.personality}</p>
      <p><strong>Lair Actions:</strong> ${d.lairs}</p>
      <button class="delete-domain">Delete</button>
    `;

    card.querySelector(".delete-domain").addEventListener("click", () => {
      Domains = Domains.filter(x => x.id !== d.id);
      saveAll();
      renderDomains();
    });

    domainList.appendChild(card);
  });
}

domainFilterBox.addEventListener("input", renderDomains);

/* ============================================================
   ========== PANEL 5 — ABILITIES (MANUAL + AI) ================
   ============================================================ */

const abilityList = document.getElementById("ability-list");
const abilityFilter = document.getElementById("ability-filter");

async function generateAbilityAI() {

  const name = document.getElementById("ability-name").value.trim();
  const target = document.getElementById("ability-target").value;
  const action = document.getElementById("ability-action").value;
  const range = document.getElementById("ability-range").value;
  const tgtinfo = document.getElementById("ability-target-info").value;
  const dc = document.getElementById("ability-dc").value;
  const dmg = document.getElementById("ability-damage").value;
  const power = parseInt(document.getElementById("ability-power").value) || 1;
  const soulCost = parseInt(document.getElementById("ability-soulcost").value) || 0;

  const types = [...document.querySelectorAll(".ability-type:checked")]
                  .map(x => x.value);
  const outcomes = [...document.querySelectorAll(".ability-outcome:checked")]
                  .map(x => x.value);

  const effectNotes = document.getElementById("ability-effect-notes").value;
  const outcomeNotes = document.getElementById("ability-outcome-notes").value;
  const mechNotes = document.getElementById("ability-mechanical").value;
  const comboNotes = document.getElementById("ability-combo").value;

  const payload = {
    mode: "genericAbility",
    name, target, action, range, tgtinfo, dc, dmg,
    power, soulCost,
    types, outcomes,
    effectNotes, outcomeNotes, mechNotes, comboNotes,
    souls: Souls, homies: Homies, domains: Domains
  };

  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("AI request failed: HTTP " + res.status);

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    // Save result
    const ability = {
      id: uuid(),
      name: name || "AI-Generated Ability",
      text: data.text
    };

    Abilities.push(ability);
    saveAll();
    renderAbilities();

  } catch (err) {
    showError("Failed to generate ability via AI.", err);
  }
}

document.getElementById("btn-ability-ai").addEventListener("click", generateAbilityAI);

document.getElementById("btn-ability-manual").addEventListener("click", () => {
  const ability = {
    id: uuid(),
    name: document.getElementById("ability-name").value,
    text: document.getElementById("ability-mechanical").value
  };

  Abilities.push(ability);
  saveAll();
  renderAbilities();
});

function renderAbilities() {
  abilityList.innerHTML = "";
  const f = abilityFilter.value.toLowerCase();

  Abilities.filter(a => a.name.toLowerCase().includes(f)).forEach(a => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h4 contenteditable="true">${a.name}</h4>
      <p contenteditable="true">${a.text}</p>
      <button class="delete-ability">Delete</button>
    `;

    card.querySelector(".delete-ability").addEventListener("click", () => {
      Abilities = Abilities.filter(x => x.id !== a.id);
      saveAll();
      renderAbilities();
    });

    abilityList.appendChild(card);
  });
}

abilityFilter.addEventListener("input", renderAbilities);

/* ============================================================
   INITIAL RENDER
   ============================================================ */

calculateSoul();
renderSoulBank();
renderHomies();
renderDomains();
renderAbilities();

refreshLinkedSoulDropdown();
refreshHomieDropdowns();

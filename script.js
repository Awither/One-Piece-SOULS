// ============== Utility: Error handling ==============

const errorBanner = document.getElementById("app-error-banner");
const errorText = document.getElementById("app-error-text");
const errorCloseBtn = document.getElementById("app-error-close");

let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 4000;

function showError(message, err) {
  console.error("[Soul Workshop Error]", message, err || "");
  if (errorText) {
    errorText.textContent = message;
  }
  if (errorBanner) {
    errorBanner.classList.remove("hidden");
  }

  const now = Date.now();
  lastAlertTime = now;
  setTimeout(() => {
    if (Date.now() - lastAlertTime >= ALERT_COOLDOWN_MS) {
      if (errorBanner) errorBanner.classList.add("hidden");
    }
  }, ALERT_COOLDOWN_MS + 500);
}

if (errorCloseBtn) {
  errorCloseBtn.addEventListener("click", () => {
    errorBanner.classList.add("hidden");
  });
}

// ============== Auto-expand textareas ==============

function autoExpandTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + 2 + "px";
}

function initAutoExpand() {
  const textareas = document.querySelectorAll("textarea");
  textareas.forEach((ta) => {
    autoExpandTextarea(ta);
    ta.addEventListener("input", () => autoExpandTextarea(ta));
  });
}

// ============== Local storage & state ==============

const STORAGE_KEY = "soul_soul_fruit_workshop_v1";

const state = {
  souls: [],
  homies: [],
  domains: [],
  abilities: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.souls = Array.isArray(parsed.souls) ? parsed.souls : [];
      state.homies = Array.isArray(parsed.homies) ? parsed.homies : [];
      state.domains = Array.isArray(parsed.domains) ? parsed.domains : [];
      state.abilities = Array.isArray(parsed.abilities) ? parsed.abilities : [];
    }
  } catch (err) {
    showError("Failed to load saved data from localStorage.", err);
  }
}

function saveState() {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    showError("Failed to save to localStorage.", err);
  }
}

// ============== Utility: IDs ==============

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ============== Soul panel refs & logic ==============

let creatureNameInput;
let rawMightInput;
let proficiencyTierSelect;
let willpowerInput;
let combinedSoulRatingSpan;
let soulLevelSpan;
let soulEnergySpan;
let soulMaxHpLostSpan;
let soulTraitsInput;
let soulNotesInput;
let soulBankList;
let soulFilterInput;

function calculateSoulFromInputs() {
  const might = Number(rawMightInput?.value || 0);
  const tier = Number(proficiencyTierSelect?.value || 0);
  const will = Number(willpowerInput?.value || 0);

  const combined = might * 2 + tier * 3 + will * 5;
  const level = Math.max(1, Math.floor(combined / 10));
  const spu = Math.floor(combined * 8.5);
  const hpLost = Math.floor(level * 2);

  if (combinedSoulRatingSpan) combinedSoulRatingSpan.textContent = combined.toString();
  if (soulLevelSpan) soulLevelSpan.textContent = level.toString();
  if (soulEnergySpan) soulEnergySpan.textContent = spu.toString();
  if (soulMaxHpLostSpan) soulMaxHpLostSpan.textContent = hpLost.toString();

  return { combined, level, spu, hpLost };
}

function handleAddSoul() {
  const { combined, level, spu, hpLost } = calculateSoulFromInputs();
  const name = (creatureNameInput?.value || "").trim();
  if (!name) {
    showError("Enter a creature name before adding a soul.");
    return;
  }

  const soul = {
    id: generateId("soul"),
    name,
    might: Number(rawMightInput?.value || 0),
    tier: Number(proficiencyTierSelect?.value || 0),
    will: Number(willpowerInput?.value || 0),
    rating: combined,
    level,
    spu,
    hpLost,
    traits: (soulTraitsInput?.value || "").trim(),
    notes: (soulNotesInput?.value || "").trim(),
    available: true,
    immuneToday: false,
  };

  state.souls.push(soul);
  saveState();
  renderSoulBank();
  populateSoulSelects();
  recalcSpuTotals();
  showError("Soul added to bank ✓", null);
}

function toggleSoulAvailability(id) {
  const soul = state.souls.find((s) => s.id === id);
  if (!soul) return;
  soul.available = !soul.available;
  saveState();
  renderSoulBank();
}

function toggleSoulImmune(id) {
  const soul = state.souls.find((s) => s.id === id);
  if (!soul) return;
  soul.immuneToday = !soul.immuneToday;
  saveState();
  renderSoulBank();
}

function deleteSoul(id) {
  state.souls = state.souls.filter((s) => s.id !== id);
  saveState();
  renderSoulBank();
  populateSoulSelects();
  recalcSpuTotals();
}

function renderSoulBank() {
  if (!soulBankList) return;
  soulBankList.innerHTML = "";

  const filter = (soulFilterInput?.value || "").toLowerCase();

  state.souls
    .filter((s) => {
      if (!filter) return true;
      return (
        s.name.toLowerCase().includes(filter) ||
        (s.traits || "").toLowerCase().includes(filter)
      );
    })
    .sort((a, b) => b.rating - a.rating)
    .forEach((soul) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-card-header";

      const title = document.createElement("h4");
      title.className = "ability-title";
      title.textContent = soul.name;

      const metaRight = document.createElement("div");
      const lvlPill = document.createElement("span");
      lvlPill.className = "power-pill";
      lvlPill.textContent = `SoL ${soul.level} • ${soul.spu} SPU`;
      metaRight.appendChild(lvlPill);

      header.appendChild(title);
      header.appendChild(metaRight);

      const meta = document.createElement("div");
      meta.className = "ability-meta";
      meta.textContent = `Might ${soul.might} • Tier ${soul.tier} • Will ${soul.will} • Max HP Lost ${soul.hpLost}`;

      const body = document.createElement("div");
      body.className = "ability-body";
      body.innerHTML = `
        <span class="ability-section-label">Traits:</span> ${
          soul.traits || "—"
        }<br/>
        <span class="ability-section-label">Notes:</span> ${
          soul.notes || "—"
        }
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-buttons";

      const btnAvail = document.createElement("button");
      btnAvail.className = "btn secondary";
      btnAvail.textContent = soul.available ? "Mark Unavailable" : "Mark Available";
      btnAvail.addEventListener("click", () => toggleSoulAvailability(soul.id));

      const btnImmune = document.createElement("button");
      btnImmune.className = "btn secondary";
      btnImmune.textContent = soul.immuneToday ? "Clear Soul-Rip Immune" : "Mark Soul-Rip Immune (24h)";
      btnImmune.addEventListener("click", () => toggleSoulImmune(soul.id));

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.addEventListener("click", () => deleteSoul(soul.id));

      btnRow.appendChild(btnAvail);
      btnRow.appendChild(btnImmune);
      btnRow.appendChild(btnDelete);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(body);
      card.appendChild(btnRow);

      soulBankList.appendChild(card);
    });
}

// ============== Homies ==============

let homieNameInput;
let homieTypeSelect;
let homieLinkedSoulSelect;
let homieSpuInput;
let homieRoleInput;
let homieHpInput;
let homieAcInput;
let homieMoveInput;
let homieAttackInput;
let homiePersonalityInput;
let homieLocationInput;
let homieDomainSelect;
let homieRosterList;
let homieFilterInput;

function createHomieFromForm() {
  const name = (homieNameInput?.value || "").trim();
  if (!name) {
    showError("Enter a Homie name.");
    return;
  }

  const homie = {
    id: generateId("homie"),
    name,
    type: homieTypeSelect?.value || "Signature",
    linkedSoulId: homieLinkedSoulSelect?.value || "",
    spu: Number(homieSpuInput?.value || 0),
    role: (homieRoleInput?.value || "").trim(),
    hp: Number(homieHpInput?.value || 0),
    ac: Number(homieAcInput?.value || 0),
    move: Number(homieMoveInput?.value || 0),
    attack: (homieAttackInput?.value || "").trim(),
    personality: (homiePersonalityInput?.value || "").trim(),
    location: (homieLocationInput?.value || "").trim(),
    domainId: homieDomainSelect?.value || "",
  };

  state.homies.push(homie);
  saveState();
  renderHomies();
  populateDomainSelects();
  populateAbilityAssignSelect();
  recalcSpuTotals();
}

function deleteHomie(id) {
  state.homies = state.homies.filter((h) => h.id !== id);
  saveState();
  renderHomies();
  populateDomainSelects();
  populateAbilityAssignSelect();
  recalcSpuTotals();
}

function renderHomies() {
  if (!homieRosterList) return;
  homieRosterList.innerHTML = "";

  const filter = (homieFilterInput?.value || "").toLowerCase();

  state.homies
    .filter((h) => {
      if (!filter) return true;
      return (
        h.name.toLowerCase().includes(filter) ||
        (h.role || "").toLowerCase().includes(filter)
      );
    })
    .forEach((homie) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-card-header";

      const title = document.createElement("h4");
      title.className = "ability-title";
      title.textContent = homie.name;

      const metaRight = document.createElement("div");
      const typePill = document.createElement("span");
      typePill.className = "power-pill";
      typePill.textContent = homie.type;
      metaRight.appendChild(typePill);

      header.appendChild(title);
      header.appendChild(metaRight);

      const meta = document.createElement("div");
      meta.className = "ability-meta";
      meta.textContent = `HP ${homie.hp || 0} • AC ${homie.ac || 0} • Move ${
        homie.move || 0
      } • SPU ${homie.spu || 0}`;

      const body = document.createElement("div");
      body.className = "ability-body";
      const linkedSoul =
        state.souls.find((s) => s.id === homie.linkedSoulId)?.name || "—";
      body.innerHTML = `
        <span class="ability-section-label">Role:</span> ${
          homie.role || "—"
        }<br/>
        <span class="ability-section-label">Attack:</span> ${
          homie.attack || "—"
        }<br/>
        <span class="ability-section-label">Personality:</span> ${
          homie.personality || "—"
        }<br/>
        <span class="ability-section-label">Location:</span> ${
          homie.location || "—"
        }<br/>
        <span class="ability-section-label">Linked Soul:</span> ${linkedSoul}
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-buttons";

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.addEventListener("click", () => deleteHomie(homie.id));

      btnRow.appendChild(btnDelete);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(body);
      card.appendChild(btnRow);

      homieRosterList.appendChild(card);
    });
}

// ============== Domains & Lair Actions ==============

let domainNameInput;
let domainTierInput;
let domainSpuInput;
let domainRangeInput;
let domainDcInput;
let domainPersonalityInput;
let domainLairsInput;
let domainNotesInput;
let domainHomiesSelect;
let domainList;
let domainFilterInput;

let lairDomainSelect;
let lairPowerInput;
let lairCountInput;
let lairCardsContainer;

function createDomainFromForm() {
  const name = (domainNameInput?.value || "").trim();
  if (!name) {
    showError("Enter a domain name.");
    return;
  }

  const domain = {
    id: generateId("domain"),
    name,
    tier: Number(domainTierInput?.value || 0),
    spu: Number(domainSpuInput?.value || 0),
    range: (domainRangeInput?.value || "").trim(),
    dc: Number(domainDcInput?.value || 0),
    personality: (domainPersonalityInput?.value || "").trim(),
    lairs: (domainLairsInput?.value || "").trim(),
    notes: (domainNotesInput?.value || "").trim(),
    homieIds: Array.from(domainHomiesSelect?.selectedOptions || []).map(
      (o) => o.value
    ),
  };

  state.domains.push(domain);
  saveState();
  renderDomains();
  populateDomainSelects();
  recalcSpuTotals();
}

function deleteDomain(id) {
  state.domains = state.domains.filter((d) => d.id !== id);
  saveState();
  renderDomains();
  populateDomainSelects();
  recalcSpuTotals();
}

function renderDomains() {
  if (!domainList) return;
  domainList.innerHTML = "";

  const filter = (domainFilterInput?.value || "").toLowerCase();

  state.domains
    .filter((d) => {
      if (!filter) return true;
      return d.name.toLowerCase().includes(filter);
    })
    .forEach((domain) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-card-header";

      const title = document.createElement("h4");
      title.className = "ability-title";
      title.textContent = domain.name;

      const metaRight = document.createElement("div");
      const powerPill = document.createElement("span");
      powerPill.className = "power-pill";
      powerPill.textContent = `Tier ${domain.tier} • ${domain.spu} SPU • Fear DC ${domain.dc}`;
      metaRight.appendChild(powerPill);

      header.appendChild(title);
      header.appendChild(metaRight);

      const meta = document.createElement("div");
      meta.className = "ability-meta";
      meta.textContent = `Control Radius: ${domain.range || "—"}`;

      const body = document.createElement("div");
      body.className = "ability-body";

      const homieNames = domain.homieIds
        .map((id) => state.homies.find((h) => h.id === id)?.name || "")
        .filter(Boolean);

      body.innerHTML = `
        <span class="ability-section-label">Personality:</span> ${
          domain.personality || "—"
        }<br/>
        <span class="ability-section-label">Territory Homies:</span> ${
          homieNames.length ? homieNames.join(", ") : "—"
        }<br/>
        <span class="ability-section-label">Lair Actions (notes):</span> ${
          domain.lairs || "—"
        }<br/>
        <span class="ability-section-label">Notes:</span> ${
          domain.notes || "—"
        }
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-buttons";

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.addEventListener("click", () => deleteDomain(domain.id));

      btnRow.appendChild(btnDelete);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(body);
      card.appendChild(btnRow);

      domainList.appendChild(card);
    });
}

// ============== Abilities (Manual & AI) ==============

let abilityNameInput;
let abilityAssignedToSelect;
let abilityActionInput;
let abilityRangeInput;
let abilityTargetInput;
let abilityDcInput;
let abilityDamageInput;
let abilityPowerInput;
let abilitySoulCostInput;
let abilityEffectNotesInput;
let abilityOutcomeNotesInput;
let abilityMechanicalInput;
let abilityComboInput;
let abilityList;
let abilityFilterInput;

function collectAbilityCheckboxValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function createAbilityFromForm(source) {
  const name = (abilityNameInput?.value || "").trim() || "Unnamed Ability";
  const assignedTo = abilityAssignedToSelect?.value || "general";

  const ability = {
    id: generateId("ability"),
    name,
    assignedTo,
    action: (abilityActionInput?.value || "").trim(),
    range: (abilityRangeInput?.value || "").trim(),
    target: (abilityTargetInput?.value || "").trim(),
    dc: (abilityDcInput?.value || "").trim(),
    damage: (abilityDamageInput?.value || "").trim(),
    power: Number(abilityPowerInput?.value || 0),
    soulCost: Number(abilitySoulCostInput?.value || 0),
    effectTypes: collectAbilityCheckboxValues(".ability-type"),
    outcomeTypes: collectAbilityCheckboxValues(".ability-outcome"),
    effectNotes: (abilityEffectNotesInput?.value || "").trim(),
    outcomeNotes: (abilityOutcomeNotesInput?.value || "").trim(),
    mechanical: (abilityMechanicalInput?.value || "").trim(),
    combo: (abilityComboInput?.value || "").trim(),
    source,
  };

  state.abilities.push(ability);
  saveState();
  renderAbilities();
  renderSummary();
  populateAbilityAssignSelect();
}

async function createAbilityViaAI() {
  const name = (abilityNameInput?.value || "").trim() || "Unnamed Ability";
  const assignedTo = abilityAssignedToSelect?.value || "general";

  const payload = {
    mode: "genericAbility",
    name,
    action: (abilityActionInput?.value || "").trim(),
    range: (abilityRangeInput?.value || "").trim(),
    target: (abilityTargetInput?.value || "").trim(),
    dc: (abilityDcInput?.value || "").trim(),
    damage: (abilityDamageInput?.value || "").trim(),
    power: Number(abilityPowerInput?.value || 0),
    soulCost: Number(abilitySoulCostInput?.value || 0),
    types: collectAbilityCheckboxValues(".ability-type"),
    outcomes: collectAbilityCheckboxValues(".ability-outcome"),
    effectNotes: (abilityEffectNotesInput?.value || "").trim(),
    outcomeNotes: (abilityOutcomeNotesInput?.value || "").trim(),
    mechNotes: (abilityMechanicalInput?.value || "").trim(),
    comboNotes: (abilityComboInput?.value || "").trim(),
    souls: state.souls,
    homies: state.homies,
    domains: state.domains,
  };

  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showError("AI request failed. Check your Vercel logs.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.text) {
      showError("AI failed to return a usable ability description.");
      return;
    }

    const ability = {
      id: generateId("ability"),
      name,
      assignedTo,
      action: payload.action,
      range: payload.range,
      target: payload.target,
      dc: payload.dc,
      damage: payload.damage,
      power: payload.power,
      soulCost: payload.soulCost,
      effectTypes: payload.types,
      outcomeTypes: payload.outcomes,
      effectNotes: payload.effectNotes,
      outcomeNotes: payload.outcomeNotes,
      mechanical: data.text,
      combo: payload.comboNotes,
      source: "AI",
    };

    state.abilities.push(ability);
    saveState();
    renderAbilities();
    renderSummary();
    populateAbilityAssignSelect();
    showError("AI ability generated ✓", null);
  } catch (err) {
    showError("Failed to talk to AI endpoint.", err);
  }
}

function deleteAbility(id) {
  state.abilities = state.abilities.filter((a) => a.id !== id);
  saveState();
  renderAbilities();
  renderSummary();
}

function rerollAbility(id) {
  const ability = state.abilities.find((a) => a.id === id);
  if (!ability) return;

  abilityEffectNotesInput.value = ability.effectNotes || "";
  abilityOutcomeNotesInput.value = ability.outcomeNotes || "";
  abilityMechanicalInput.value = ability.mechanical || "";
  abilityComboInput.value = ability.combo || "";
  abilityPowerInput.value = ability.power || 7;
  abilitySoulCostInput.value = ability.soulCost || 0;
}

function renderAbilities() {
  if (!abilityList) return;
  abilityList.innerHTML = "";

  const filter = (abilityFilterInput?.value || "").toLowerCase();

  state.abilities
    .filter((a) => {
      if (!filter) return true;
      return a.name.toLowerCase().includes(filter);
    })
    .forEach((ability) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-card-header";

      const title = document.createElement("h4");
      title.className = "ability-title";
      title.textContent = ability.name;

      const right = document.createElement("div");
      const powerPill = document.createElement("span");
      powerPill.className = "power-pill";
      powerPill.textContent = `Pwr ${ability.power || 0}`;
      right.appendChild(powerPill);
      header.appendChild(title);
      header.appendChild(right);

      const meta = document.createElement("div");
      meta.className = "ability-meta";
      meta.innerHTML = `
        <span>Action: ${ability.action || "—"}</span>
        <span>Range: ${ability.range || "—"}</span>
        <span>Target: ${ability.target || "—"}</span>
        <span>Save/DC: ${ability.dc || "—"}</span>
        <span>Damage: ${ability.damage || "—"}</span>
      `;

      const body = document.createElement("div");
      body.className = "ability-body";
      body.innerHTML = `
        <span class="ability-section-label">Effect:</span> ${
          ability.mechanical || "—"
        }<br/>
        <span class="ability-section-label">Combo:</span> ${
          ability.combo || "—"
        }
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-buttons";

      const btnCopy = document.createElement("button");
      btnCopy.className = "btn secondary";
      btnCopy.textContent = "Copy";
      btnCopy.addEventListener("click", () => {
        const text = `${ability.name}\nAction: ${ability.action}\nRange: ${
          ability.range
        }\nTarget: ${ability.target}\nSave/DC: ${ability.dc}\nDamage: ${
          ability.damage
        }\n\nEffect:\n${ability.mechanical}\n\nCombo:\n${ability.combo}`;
        navigator.clipboard?.writeText(text).catch(() => {});
      });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.addEventListener("click", () => deleteAbility(ability.id));

      const btnReroll = document.createElement("button");
      btnReroll.className = "btn primary";
      btnReroll.textContent = "Reroll";
      btnReroll.addEventListener("click", () => rerollAbility(ability.id));

      btnRow.appendChild(btnCopy);
      btnRow.appendChild(btnDelete);
      btnRow.appendChild(btnReroll);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(body);
      card.appendChild(btnRow);

      abilityList.appendChild(card);
    });
}

// ============== AI Lair Actions ==============

let lastLairPayload = null;

async function generateLairActions() {
  if (!lairDomainSelect) return;
  const domainId = lairDomainSelect.value;
  const domain = state.domains.find((d) => d.id === domainId);
  if (!domain) {
    showError("Select a domain for lair actions.");
    return;
  }

  const power = Number(lairPowerInput?.value || 0) || 7;
  const count = Math.min(
    5,
    Math.max(1, Number(lairCountInput?.value || 1) || 1)
  );

  const payload = {
    mode: "domainLair",
    domain,
    power,
    count,
  };
  lastLairPayload = payload;

  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showError("AI request failed when generating lair actions.");
      return;
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.lairs)) {
      showError("AI did not return valid lair actions.");
      return;
    }

    renderLairCards(data.lairs);
  } catch (err) {
    showError("Error while generating lair actions.", err);
  }
}

async function rerollLairActions() {
  if (!lastLairPayload) {
    showError("No previous lair actions to reroll.");
    return;
  }
  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastLairPayload),
    });
    if (!res.ok) {
      showError("AI request failed when rerolling lair actions.");
      return;
    }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.lairs)) {
      showError("AI did not return valid lair actions.");
      return;
    }
    renderLairCards(data.lairs);
  } catch (err) {
    showError("Error while rerolling lair actions.", err);
  }
}

function renderLairCards(lairs) {
  if (!lairCardsContainer) return;
  lairCardsContainer.innerHTML = "";
  lairs.forEach((lair) => {
    const card = document.createElement("div");
    card.className = "lair-card";

    const header = document.createElement("div");
    header.className = "ability-card-header";

    const title = document.createElement("h4");
    title.className = "ability-title";
    title.textContent = lair.name || "Lair Action";

    const metaRight = document.createElement("div");
    const powerPill = document.createElement("span");
    powerPill.className = "power-pill";
    powerPill.textContent = `Pwr ${lair.power || 0}`;
    metaRight.appendChild(powerPill);
    header.appendChild(title);
    header.appendChild(metaRight);

    const body = document.createElement("div");
    body.className = "ability-body";
    body.innerHTML = lair.text || "";

    card.appendChild(header);
    card.appendChild(body);

    lairCardsContainer.appendChild(card);
  });
}

// ============== Playable View Summary ==============

let playableHomiesContainer;
let playableDomainsContainer;

function renderSummary() {
  if (!playableHomiesContainer || !playableDomainsContainer) return;

  playableHomiesContainer.innerHTML = "";
  playableDomainsContainer.innerHTML = "";

  // Homie dropdowns with abilities
  state.homies.forEach((homie) => {
    const item = document.createElement("div");
    item.className = "playable-item";

    const header = document.createElement("div");
    header.className = "playable-header";

    const title = document.createElement("div");
    title.className = "playable-title";
    title.textContent = `${homie.name} (HP ${homie.hp || 0}, AC ${
      homie.ac || 0
    })`;

    const toggle = document.createElement("button");
    toggle.className = "btn secondary";
    toggle.textContent = "Details";

    const body = document.createElement("div");
    body.className = "playable-body hidden";

    const homieAbilities = state.abilities.filter(
      (a) => a.assignedTo === homie.id
    );

    const abilityHtml =
      homieAbilities.length === 0
        ? "<em>No assigned abilities yet.</em>"
        : homieAbilities
            .map(
              (a) => `
          <div class="ability-card" style="margin-top:6px;">
            <div class="ability-card-header">
              <h4 class="ability-title">${a.name}</h4>
              <span class="power-pill">Pwr ${a.power || 0}</span>
            </div>
            <div class="ability-meta">
              <span>Action: ${a.action || "—"}</span>
              <span>Range: ${a.range || "—"}</span>
              <span>Target: ${a.target || "—"}</span>
            </div>
            <div class="ability-body">
              ${a.mechanical || ""}
            </div>
          </div>`
            )
            .join("");

    body.innerHTML = `
      <div class="muted">Role: ${homie.role || "—"}</div>
      <div class="muted">Attack: ${homie.attack || "—"}</div>
      <div class="muted">Personality: ${homie.personality || "—"}</div>
      <div class="muted">Location: ${homie.location || "—"}</div>
      <hr class="card-separator" />
      <div class="ability-section-label">Abilities</div>
      ${abilityHtml}
    `;

    toggle.addEventListener("click", () => {
      body.classList.toggle("hidden");
    });

    header.appendChild(title);
    header.appendChild(toggle);
    item.appendChild(header);
    item.appendChild(body);
    playableHomiesContainer.appendChild(item);
  });

  // Domain dropdowns with lair notes (plus any abilities assigned directly to domain)
  state.domains.forEach((domain) => {
    const item = document.createElement("div");
    item.className = "playable-item";

    const header = document.createElement("div");
    header.className = "playable-header";

    const title = document.createElement("div");
    title.className = "playable-title";
    title.textContent = `${domain.name} (Tier ${domain.tier}, Fear DC ${
      domain.dc || 0
    })`;

    const toggle = document.createElement("button");
    toggle.className = "btn secondary";
    toggle.textContent = "Details";

    const body = document.createElement("div");
    body.className = "playable-body hidden";

    const domainAbilities = state.abilities.filter(
      (a) => a.assignedTo === domain.id
    );

    const abilityHtml =
      domainAbilities.length === 0
        ? "<em>No domain abilities yet.</em>"
        : domainAbilities
            .map(
              (a) => `
          <div class="ability-card" style="margin-top:6px;">
            <div class="ability-card-header">
              <h4 class="ability-title">${a.name}</h4>
              <span class="power-pill">Pwr ${a.power || 0}</span>
            </div>
            <div class="ability-meta">
              <span>Action: ${a.action || "—"}</span>
              <span>Range: ${a.range || "—"}</span>
              <span>Target: ${a.target || "—"}</span>
            </div>
            <div class="ability-body">
              ${a.mechanical || ""}
            </div>
          </div>`
            )
            .join("");

    body.innerHTML = `
      <div class="muted">Control Radius: ${domain.range || "—"}</div>
      <div class="muted">Personality: ${domain.personality || "—"}</div>
      <div class="muted">Lair Actions (notes): ${domain.lairs || "—"}</div>
      <hr class="card-separator" />
      <div class="ability-section-label">Domain Abilities</div>
      ${abilityHtml}
    `;

    toggle.addEventListener("click", () => {
      body.classList.toggle("hidden");
    });

    header.appendChild(title);
    header.appendChild(toggle);
    item.appendChild(header);
    item.appendChild(body);
    playableDomainsContainer.appendChild(item);
  });
}

// ============== SPU totals ==============

function recalcSpuTotals() {
  const soulsArray = Array.isArray(state.souls) ? state.souls : [];
  const homiesArray = Array.isArray(state.homies) ? state.homies : [];
  const domainsArray = Array.isArray(state.domains) ? state.domains : [];

  const totalSPU = soulsArray.reduce((sum, s) => sum + (s.spu || 0), 0);
  const homieSPU = homiesArray.reduce((sum, h) => sum + (h.spu || 0), 0);
  const domainSPU = domainsArray.reduce((sum, d) => sum + (d.spu || 0), 0);

  const spent = homieSPU + domainSPU;
  const available = Math.max(0, totalSPU - spent);

  const totalEl = document.getElementById("total-spu");
  const spentEl = document.getElementById("spent-spu");
  const availEl = document.getElementById("available-spu");

  if (totalEl) totalEl.textContent = totalSPU.toString();
  if (spentEl) spentEl.textContent = spent.toString();
  if (availEl) availEl.textContent = available.toString();
}

// ============== Save / Reset / Print ==============

function handleManualSave() {
  saveState();
  showError("Data saved locally ✓", null);
}

function handleReset() {
  if (!confirm("This will clear all souls, homies, domains, and abilities. Proceed?")) {
    return;
  }
  state.souls = [];
  state.homies = [];
  state.domains = [];
  state.abilities = [];
  saveState();
  renderSoulBank();
  renderHomies();
  renderDomains();
  renderAbilities();
  renderSummary();
  populateSoulSelects();
  populateDomainSelects();
  populateAbilityAssignSelect();
  recalcSpuTotals();
}

function handlePrint() {
  window.print();
}

// ============== Select helpers (linked souls, domains, ability assignment) ==============

function populateSoulSelects() {
  if (!homieLinkedSoulSelect) return;
  homieLinkedSoulSelect.innerHTML = `<option value="">— None —</option>`;
  state.souls.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.spu} SPU)`;
    homieLinkedSoulSelect.appendChild(opt);
  });
}

function populateDomainSelects() {
  if (homieDomainSelect) {
    homieDomainSelect.innerHTML = `<option value="">— None —</option>`;
    state.domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      homieDomainSelect.appendChild(opt);
    });
  }

  if (domainHomiesSelect) {
    // Homies shown here are all of them; you can decide manually which count as territory homies
    domainHomiesSelect.innerHTML = "";
    state.homies.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = h.name;
      domainHomiesSelect.appendChild(opt);
    });
  }

  if (lairDomainSelect) {
    lairDomainSelect.innerHTML = "";
    state.domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      lairDomainSelect.appendChild(opt);
    });
  }
}

function populateAbilityAssignSelect() {
  if (!abilityAssignedToSelect) return;

  abilityAssignedToSelect.innerHTML = "";

  const generalOpt = document.createElement("option");
  generalOpt.value = "general";
  generalOpt.textContent = "General / Party";
  abilityAssignedToSelect.appendChild(generalOpt);

  const homieGroup = document.createElement("optgroup");
  homieGroup.label = "Homies";
  state.homies.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.name;
    homieGroup.appendChild(opt);
  });
  abilityAssignedToSelect.appendChild(homieGroup);

  const domainGroup = document.createElement("optgroup");
  domainGroup.label = "Domains";
  state.domains.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    domainGroup.appendChild(opt);
  });
  abilityAssignedToSelect.appendChild(domainGroup);
}

// ============== Panel collapsers ==============

function initPanelToggles() {
  const panels = document.querySelectorAll(".panel");
  panels.forEach((panel) => {
    const btn = panel.querySelector(".panel-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const body = panel.querySelector(".panel-body");
      if (!body) return;
      const isHidden = body.classList.toggle("collapsed");
      btn.textContent = isHidden ? "▾" : "▴";
    });
  });
}

// ============== Section navigation buttons (NEW) ==============

function initSectionNav() {
  const navButtons = document.querySelectorAll(".section-nav-btn");
  if (!navButtons || !navButtons.length) return;

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      const panel = document.getElementById(targetId);
      if (!panel) return;

      panel.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });
}

// ============== Initialize ==============

function init() {
  try {
    // Assign DOM refs now that DOM is fully loaded
    creatureNameInput = document.getElementById("creature-name");
    rawMightInput = document.getElementById("raw-might");
    proficiencyTierSelect =
      document.getElementById("proficiency-tier");
    willpowerInput = document.getElementById("willpower-level");
    combinedSoulRatingSpan =
      document.getElementById("combined-soul-rating");
    soulLevelSpan = document.getElementById("soul-level");
    soulEnergySpan = document.getElementById("soul-energy");
    soulMaxHpLostSpan = document.getElementById("soul-max-hp-lost");
    soulTraitsInput = document.getElementById("soul-traits");
    soulNotesInput = document.getElementById("soul-notes");
    soulBankList = document.getElementById("soul-bank-list");
    soulFilterInput = document.getElementById("soul-filter");

    homieNameInput = document.getElementById("homie-name");
    homieTypeSelect = document.getElementById("homie-type");
    homieLinkedSoulSelect =
      document.getElementById("homie-linked-soul");
    homieSpuInput = document.getElementById("homie-spu");
    homieRoleInput = document.getElementById("homie-role");
    homieHpInput = document.getElementById("homie-hp");
    homieAcInput = document.getElementById("homie-ac");
    homieMoveInput = document.getElementById("homie-move");
    homieAttackInput = document.getElementById("homie-attack");
    homiePersonalityInput =
      document.getElementById("homie-personality");
    homieLocationInput = document.getElementById("homie-location");
    homieDomainSelect = document.getElementById("homie-domain");
    homieRosterList = document.getElementById("homie-roster");
    homieFilterInput = document.getElementById("homie-filter");

    domainNameInput = document.getElementById("domain-name");
    domainTierInput = document.getElementById("domain-tier");
    domainSpuInput = document.getElementById("domain-spu");
    domainRangeInput = document.getElementById("domain-range");
    domainDcInput = document.getElementById("domain-dc");
    domainPersonalityInput =
      document.getElementById("domain-personality");
    domainLairsInput = document.getElementById("domain-lairs");
    domainNotesInput = document.getElementById("domain-notes");
    domainHomiesSelect = document.getElementById("domain-homies");
    domainList = document.getElementById("domain-list");
    domainFilterInput = document.getElementById("domain-filter");

    lairDomainSelect = document.getElementById("lair-domain-select");
    lairPowerInput = document.getElementById("lair-power");
    lairCountInput = document.getElementById("lair-count");
    lairCardsContainer = document.getElementById("lair-action-cards");

    abilityNameInput = document.getElementById("ability-name");
    abilityAssignedToSelect =
      document.getElementById("ability-assigned-to");
    abilityActionInput = document.getElementById("ability-action");
    abilityRangeInput = document.getElementById("ability-range");
    abilityTargetInput = document.getElementById("ability-target");
    abilityDcInput = document.getElementById("ability-dc");
    abilityDamageInput = document.getElementById("ability-damage");
    abilityPowerInput = document.getElementById("ability-power");
    abilitySoulCostInput =
      document.getElementById("ability-soul-cost");
    abilityEffectNotesInput =
      document.getElementById("ability-effect-notes");
    abilityOutcomeNotesInput =
      document.getElementById("ability-outcome-notes");
    abilityMechanicalInput =
      document.getElementById("ability-mechanical");
    abilityComboInput = document.getElementById("ability-combo");
    abilityList = document.getElementById("ability-list");
    abilityFilterInput = document.getElementById("ability-filter");

    playableHomiesContainer =
      document.getElementById("playable-homies");
    playableDomainsContainer =
      document.getElementById("playable-domains");

    // Global handlers
    document
      .getElementById("btn-recalc-soul")
      ?.addEventListener("click", calculateSoulFromInputs);
    document
      .getElementById("btn-add-soul")
      ?.addEventListener("click", handleAddSoul);
    soulFilterInput?.addEventListener("input", renderSoulBank);

    document
      .getElementById("btn-create-homie")
      ?.addEventListener("click", createHomieFromForm);
    homieFilterInput?.addEventListener("input", renderHomies);

    document
      .getElementById("btn-create-domain")
      ?.addEventListener("click", createDomainFromForm);
    domainFilterInput?.addEventListener("input", renderDomains);

    document
      .getElementById("btn-create-ability-manual")
      ?.addEventListener("click", () =>
        createAbilityFromForm("Manual")
      );
    document
      .getElementById("btn-create-ability-ai")
      ?.addEventListener("click", createAbilityViaAI);
    abilityFilterInput?.addEventListener("input", renderAbilities);

    document
      .getElementById("btn-generate-lairs")
      ?.addEventListener("click", generateLairActions);
    document
      .getElementById("btn-reroll-lairs")
      ?.addEventListener("click", rerollLairActions);

    document
      .getElementById("btn-save")
      ?.addEventListener("click", handleManualSave);
    document
      .getElementById("btn-reset")
      ?.addEventListener("click", handleReset);
    document
      .getElementById("btn-print")
      ?.addEventListener("click", handlePrint);

    // Core initialization
    loadState();
    initAutoExpand();
    initPanelToggles();

    calculateSoulFromInputs();

    renderSoulBank();
    renderHomies();
    renderDomains();
    renderAbilities();
    renderSummary();

    populateSoulSelects();
    populateDomainSelects();
    populateAbilityAssignSelect();
    initSectionNav();
    recalcSpuTotals();
  } catch (err) {
    showError("Initialization failed. Some features may not work.", err);
  }
}

document.addEventListener("DOMContentLoaded", init);

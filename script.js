// ============== Utility: Error handling ==============

const errorBanner = document.getElementById("app-error-banner");
const errorText = document.getElementById("app-error-text");
const errorCloseBtn = document.getElementById("app-error-close");

function showError(message, err) {
  console.error("[Soul Workshop Error]", message, err || "");
  if (errorText) {
    errorText.textContent = message;
  }
  if (errorBanner) {
    errorBanner.classList.remove("hidden");
  }
}

function clearError() {
  if (errorBanner) {
    errorBanner.classList.add("hidden");
  }
}

if (errorCloseBtn) {
  errorCloseBtn.addEventListener("click", clearError);
}

// Global catch-all
window.addEventListener("error", (event) => {
  showError(event.message || "Unknown script error", event.error);
});

// ============== State & persistence ==============

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
      state.souls = parsed.souls || [];
      state.homies = parsed.homies || [];
      state.domains = parsed.domains || [];
      state.abilities = parsed.abilities || [];
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
    showError("Failed to save data to localStorage.", err);
  }
}

// ============== Helpers ==============

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function setupAutoResize() {
  const textareas = document.querySelectorAll("textarea.auto-resize");
  textareas.forEach((ta) => {
    autoResizeTextarea(ta);
    ta.addEventListener("input", () => autoResizeTextarea(ta));
  });
}

// ============== Panel toggle ==============

function setupPanelToggles() {
  const toggles = document.querySelectorAll(".panel-toggle");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".panel");
      if (!panel) return;
      const body = panel.querySelector(".panel-body");
      if (!body) return;
      const isHidden = body.classList.toggle("collapsed");
      btn.textContent = isHidden ? "▾" : "▴";
    });
  });
}

// ============== SPU totals ==============

function recalcSpuTotals() {
  const totalSPU = state.souls.reduce((sum, s) => sum + (s.spu || 0), 0);
  // Homie SPU: initial + upgrade + revival
  const homieSpent = state.homies.reduce((sum, h) => {
    return sum + (h.totalSPUInvested || 0) + (h.revivalSPUSpent || 0);
  }, 0);
  const domainSpent = state.domains.reduce((sum, d) => sum + (d.spuInvested || 0), 0);

  const spentSPU = homieSpent + domainSpent;
  const availableSPU = totalSPU - spentSPU;

  document.getElementById("total-spu").textContent = totalSPU;
  document.getElementById("spent-spu").textContent = spentSPU;
  const availableEl = document.getElementById("available-spu");
  availableEl.textContent = availableSPU;
  if (availableSPU < 0) {
    availableEl.style.color = "#ff8080";
  } else {
    availableEl.style.color = "";
  }
}

// ============== Panel 1: Soul Rating & Bank ==============

const creatureNameInput = document.getElementById("creature-name");
const rawMightInput = document.getElementById("raw-might");
const proficiencyTierSelect = document.getElementById("proficiency-tier");
const willpowerInput = document.getElementById("willpower-level");
const combinedSoulRatingSpan = document.getElementById("combined-soul-rating");
const soulLevelSpan = document.getElementById("soul-level");
const soulEnergySpan = document.getElementById("soul-energy");
const soulMaxHpLostSpan = document.getElementById("soul-max-hp-lost");
const soulTraitsInput = document.getElementById("soul-traits");
const soulNotesInput = document.getElementById("soul-notes");
const soulFilterInput = document.getElementById("soul-filter-input");
const soulBankList = document.getElementById("soul-bank-list");

let lastSoulCalculation = null;

function calculateSoulFromInputs() {
  try {
    const rawMight = clamp(Number(rawMightInput.value) || 0, 1, 10);
    const proficiencyTier = clamp(Number(proficiencyTierSelect.value) || 0, 0, 9);
    const willpower = clamp(Number(willpowerInput.value) || 0, 1, 10);

    const combinedRating = rawMight * 2 + proficiencyTier * 3 + willpower * 4;
    const soulLevel = clamp(Math.ceil(combinedRating / 9), 1, 10);

    const maxCSR = 87; // (10*2 + 9*3 + 10*4)
    const ratio = combinedRating / maxCSR;
    const spu = Math.round(Math.pow(ratio, 2) * 1000);
    const hpLost = Math.round(spu / 25);

    combinedSoulRatingSpan.textContent = combinedRating;
    soulLevelSpan.textContent = soulLevel;
    soulEnergySpan.textContent = spu;
    soulMaxHpLostSpan.textContent = hpLost;

    lastSoulCalculation = {
      combinedRating,
      soulLevel,
      spu,
      hpLost,
    };
  } catch (err) {
    showError("Failed to calculate soul rating.", err);
  }
}

function addSoulToBank() {
  if (!lastSoulCalculation) {
    calculateSoulFromInputs();
  }
  try {
    const base = lastSoulCalculation || { combinedRating: 0, soulLevel: 1, spu: 0, hpLost: 0 };
    const newSoul = {
      id: generateId("soul"),
      name: creatureNameInput.value || "Unnamed Soul",
      rawMight: clamp(Number(rawMightInput.value) || 0, 1, 10),
      proficiencyTier: clamp(Number(proficiencyTierSelect.value) || 0, 0, 9),
      willpower: clamp(Number(willpowerInput.value) || 0, 1, 10),
      combinedRating: base.combinedRating,
      soulLevel: base.soulLevel,
      spu: base.spu,
      maxHpLost: base.hpLost,
      traits: soulTraitsInput.value || "",
      notes: soulNotesInput.value || "",
      availableForCrafting: true,
      soulRipImmune: false,
    };
    state.souls.push(newSoul);
    saveState();
    renderSoulBank();
    recalcSpuTotals();
    populateSoulSelects();
  } catch (err) {
    showError("Failed to add soul to bank.", err);
  }
}

function renderSoulBank() {
  if (!soulBankList) return;
  soulBankList.innerHTML = "";
  const filter = (soulFilterInput.value || "").toLowerCase().trim();

  const souls = state.souls.filter((s) => {
    if (!filter) return true;
    return (
      (s.name && s.name.toLowerCase().includes(filter)) ||
      (s.traits && s.traits.toLowerCase().includes(filter))
    );
  });

  if (!souls.length) {
    soulBankList.classList.add("empty-message");
    soulBankList.innerHTML = "<p>No souls match that filter yet.</p>";
    return;
  }
  soulBankList.classList.remove("empty-message");

  souls.forEach((soul) => {
    const card = document.createElement("div");
    card.className = "entity-card";

    const header = document.createElement("div");
    header.className = "entity-card-header";

    const title = document.createElement("div");
    title.className = "entity-card-title";
    title.textContent = soul.name;

    const tags = document.createElement("div");
    tags.className = "entity-tags";

    const tagLevel = document.createElement("span");
    tagLevel.className = "tag";
    tagLevel.textContent = `SoL ${soul.soulLevel}`;
    tags.appendChild(tagLevel);

    const tagSpu = document.createElement("span");
    tagSpu.className = "tag spu";
    tagSpu.textContent = `${soul.spu} SPU`;
    tags.appendChild(tagSpu);

    if (soul.soulRipImmune) {
      const t = document.createElement("span");
      t.className = "tag";
      t.textContent = "Soul-Rip Immune (24h)";
      tags.appendChild(t);
    }

    if (soul.availableForCrafting) {
      const t = document.createElement("span");
      t.className = "tag";
      t.textContent = "Available for crafting";
      tags.appendChild(t);
    }

    header.appendChild(title);
    header.appendChild(tags);

    const body = document.createElement("div");
    body.className = "entity-card-body single-column";

    const section = document.createElement("div");
    section.className = "entity-card-section";
    section.innerHTML = `
      <div><strong>Rating:</strong> ${soul.combinedRating}</div>
      <div><strong>Raw Might:</strong> ${soul.rawMight} | <strong>Tier:</strong> ${soul.proficiencyTier} | <strong>Willpower:</strong> ${soul.willpower}</div>
      <div><strong>Suggested Max HP Lost:</strong> ${soul.maxHpLost}</div>
      <div><strong>Traits:</strong> ${soul.traits || "—"}</div>
      <div><strong>Notes:</strong></div>
    `;

    const notesArea = document.createElement("textarea");
    notesArea.className = "auto-resize";
    notesArea.value = soul.notes || "";
    notesArea.addEventListener("input", () => {
      soul.notes = notesArea.value;
      autoResizeTextarea(notesArea);
      saveState();
    });
    autoResizeTextarea(notesArea);
    section.appendChild(notesArea);
    body.appendChild(section);

    const footer = document.createElement("div");
    footer.className = "entity-card-footer";

    const craftingToggle = document.createElement("button");
    craftingToggle.className = "btn small outline";
    craftingToggle.textContent = soul.availableForCrafting ? "Mark Unavailable" : "Mark Available";
    craftingToggle.addEventListener("click", () => {
      soul.availableForCrafting = !soul.availableForCrafting;
      saveState();
      renderSoulBank();
    });

    const immuneToggle = document.createElement("button");
    immuneToggle.className = "btn small outline";
    immuneToggle.textContent = soul.soulRipImmune ? "Clear Soul-Rip Immune" : "Mark Soul-Rip Immune (24h)";
    immuneToggle.addEventListener("click", () => {
      soul.soulRipImmune = !soul.soulRipImmune;
      saveState();
      renderSoulBank();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const idx = state.souls.findIndex((s) => s.id === soul.id);
      if (idx >= 0) {
        state.souls.splice(idx, 1);
        saveState();
        renderSoulBank();
        populateSoulSelects();
        recalcSpuTotals();
      }
    });

    footer.appendChild(craftingToggle);
    footer.appendChild(immuneToggle);
    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    soulBankList.appendChild(card);
  });

  setupAutoResize();
}

// ============== Panel 2: Homies ==============

const homieLinkedSoulSelect = document.getElementById("homie-linked-soul");
const homieAssignedDomainSelect = document.getElementById("homie-assigned-domain");
const homieRosterList = document.getElementById("homie-roster-list");
const homieFilterInput = document.getElementById("homie-filter-input");

function populateSoulSelects() {
  if (!homieLinkedSoulSelect) return;
  const oldValue = homieLinkedSoulSelect.value;
  homieLinkedSoulSelect.innerHTML = '<option value="">— None / Composite —</option>';
  state.souls.forEach((soul) => {
    const opt = document.createElement("option");
    opt.value = soul.id;
    opt.textContent = `${soul.name} (${soul.spu} SPU)`;
    homieLinkedSoulSelect.appendChild(opt);
  });
  homieLinkedSoulSelect.value = oldValue;

  // Also for AI context if needed later; no extra selects here.
}

function populateDomainSelects() {
  const selects = [homieAssignedDomainSelect];
  selects.forEach((sel) => {
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">— None yet —</option>';
    state.domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
    sel.value = prev;
  });

  // Domain Territory Homies multiselect
  const domainTerritorySelect = document.getElementById("domain-territory-homies");
  if (domainTerritorySelect) {
    const selectedValues = Array.from(domainTerritorySelect.selectedOptions).map((o) => o.value);
    domainTerritorySelect.innerHTML = "";
    state.homies
      .filter((h) => h.type === "Territory")
      .forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = h.name;
        if (selectedValues.includes(h.id)) opt.selected = true;
        domainTerritorySelect.appendChild(opt);
      });
  }
}

function populateAbilityAssignSelect() {
  const assignSelect = document.getElementById("ability-assign-to");
  if (!assignSelect) return;
  const prev = assignSelect.value;
  assignSelect.innerHTML = '<option value="General / Party">General / Party</option>';
  state.homies.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.name;
    opt.textContent = `Homie: ${h.name}`;
    assignSelect.appendChild(opt);
  });
  state.domains.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = `Domain: ${d.name}`;
    opt.textContent = `Domain: ${d.name}`;
    assignSelect.appendChild(opt);
  });
  assignSelect.value = prev || "General / Party";

  // Also AI homie target
  const aiTarget = document.getElementById("ai-homie-target");
  if (aiTarget) {
    const prevT = aiTarget.value;
    aiTarget.innerHTML = '<option value="">— Select Homie —</option>';
    state.homies.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = h.name;
      aiTarget.appendChild(opt);
    });
    aiTarget.value = prevT;
  }
}

function createHomieFromForm() {
  try {
    const name = document.getElementById("homie-name").value || "Unnamed Homie";
    const type = document.getElementById("homie-type").value || "Minor";
    const linkedSoulId = homieLinkedSoulSelect.value || "";
    const initialSPU = Math.max(0, Number(document.getElementById("homie-initial-spu").value) || 0);
    const role = document.getElementById("homie-role").value || "";
    const hp = document.getElementById("homie-hp").value || "";
    const ac = document.getElementById("homie-ac").value || "";
    const move = document.getElementById("homie-move").value || "";
    const primaryDamage = document.getElementById("homie-primary-damage").value || "";
    const abilities = document.getElementById("homie-abilities").value || "";
    const traits = document.getElementById("homie-traits").value || "";
    const boundLocation = document.getElementById("homie-bound-location").value || "";
    const assignedDomainId = homieAssignedDomainSelect.value || "";
    const territoryActions = document.getElementById("homie-territory-actions").value || "";
    const buffEffects = document.getElementById("homie-buff-effects").value || "";

    const homie = {
      id: generateId("homie"),
      name,
      type,
      linkedSoulId,
      initialSPU,
      role,
      hp,
      ac,
      move,
      primaryDamage,
      abilities,
      traits,
      boundLocation,
      assignedDomainId,
      territoryActions,
      buffEffects,
      tiers: {
        hp: 0,
        ac: 0,
        damage: 0,
        utility: 0,
      },
      totalSPUInvested: initialSPU,
      revivalSPUSpent: 0,
      destroyed: false,
      summaryNotes: "",
    };

    state.homies.push(homie);
    saveState();
    renderHomies();
    recalcSpuTotals();
    populateDomainSelects();
    populateAbilityAssignSelect();
    renderDomains();
    renderSummary();
  } catch (err) {
    showError("Failed to create homie.", err);
  }
}

function upgradeHomieTier(homie, statKey) {
  const tierCostBase = 5;
  homie.tiers[statKey] = (homie.tiers[statKey] || 0) + 1;
  const addedSPU = tierCostBase * homie.tiers[statKey];
  homie.totalSPUInvested += addedSPU;
  saveState();
  renderHomies();
  recalcSpuTotals();
  renderSummary();
}

function markHomieDestroyed(homie) {
  homie.destroyed = !homie.destroyed;
  saveState();
  renderHomies();
  renderSummary();
}

function reviveHomie(homie) {
  const revivalCost = Math.floor((homie.totalSPUInvested || 0) / 2);
  homie.revivalSPUSpent = (homie.revivalSPUSpent || 0) + revivalCost;
  homie.destroyed = false;
  saveState();
  recalcSpuTotals();
  renderHomies();
  renderSummary();
}

function renderHomies() {
  if (!homieRosterList) return;
  homieRosterList.innerHTML = "";
  const filter = (homieFilterInput.value || "").toLowerCase().trim();
  const homies = state.homies.filter((h) => {
    if (!filter) return true;
    return (
      (h.name && h.name.toLowerCase().includes(filter)) ||
      (h.role && h.role.toLowerCase().includes(filter))
    );
  });

  if (!homies.length) {
    homieRosterList.classList.add("empty-message");
    homieRosterList.innerHTML = "<p>No Homies match that filter yet.</p>";
    return;
  }
  homieRosterList.classList.remove("empty-message");

  homies.forEach((h) => {
    const card = document.createElement("div");
    card.className = "entity-card";

    const header = document.createElement("div");
    header.className = "entity-card-header";

    const title = document.createElement("div");
    title.className = "entity-card-title";
    title.textContent = h.name;

    const tags = document.createElement("div");
    tags.className = "entity-tags";

    const tagType = document.createElement("span");
    tagType.className = "tag homie";
    tagType.textContent = h.type;
    tags.appendChild(tagType);

    const tagSPU = document.createElement("span");
    tagSPU.className = "tag spu";
    tagSPU.textContent = `${h.totalSPUInvested} SPU`;
    tags.appendChild(tagSPU);

    if (h.destroyed) {
      const t = document.createElement("span");
      t.className = "tag";
      t.textContent = "Destroyed";
      tags.appendChild(t);
    }

    header.appendChild(title);
    header.appendChild(tags);

    const body = document.createElement("div");
    body.className = "entity-card-body";

    const left = document.createElement("div");
    left.className = "entity-card-section";
    const linkedSoul = state.souls.find((s) => s.id === h.linkedSoulId);
    const domain = state.domains.find((d) => d.id === h.assignedDomainId);

    left.innerHTML = `
      <div><strong>Role:</strong> ${h.role || "—"}</div>
      <div><strong>HP:</strong> ${h.hp || "—"} | <strong>AC:</strong> ${h.ac || "—"} | <strong>Move:</strong> ${
      h.move || "—"
    }</div>
      <div><strong>Primary Damage:</strong> ${h.primaryDamage || "—"}</div>
      <div><strong>Linked Soul:</strong> ${linkedSoul ? linkedSoul.name : "—"}</div>
      <div><strong>Assigned Domain:</strong> ${domain ? domain.name : "—"}</div>
    `;

    const right = document.createElement("div");
    right.className = "entity-card-section";
    right.innerHTML = `
      <div><strong>Tiers</strong></div>
      <div>HP Tier: ${h.tiers.hp || 0}</div>
      <div>AC Tier: ${h.tiers.ac || 0}</div>
      <div>Damage Tier: ${h.tiers.damage || 0}</div>
      <div>Utility Tier: ${h.tiers.utility || 0}</div>
      <div><strong>Personality:</strong> ${h.traits || "—"}</div>
    `;

    body.appendChild(left);
    body.appendChild(right);

    const footer = document.createElement("div");
    footer.className = "entity-card-footer";

    ["hp", "ac", "damage", "utility"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "btn small outline";
      btn.textContent = `+ ${key.toUpperCase()} Tier`;
      btn.addEventListener("click", () => upgradeHomieTier(h, key));
      footer.appendChild(btn);
    });

    const destroyBtn = document.createElement("button");
    destroyBtn.className = "btn small danger";
    destroyBtn.textContent = h.destroyed ? "Mark Restored" : "Mark Destroyed";
    destroyBtn.addEventListener("click", () => markHomieDestroyed(h));
    footer.appendChild(destroyBtn);

    const revivalCost = Math.floor((h.totalSPUInvested || 0) / 2);
    const reviveBtn = document.createElement("button");
    reviveBtn.className = "btn small secondary";
    reviveBtn.textContent = `Revive (${revivalCost} SPU)`;
    reviveBtn.addEventListener("click", () => reviveHomie(h));
    footer.appendChild(reviveBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small outline";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const idx = state.homies.findIndex((x) => x.id === h.id);
      if (idx >= 0) {
        state.homies.splice(idx, 1);
        saveState();
        renderHomies();
        recalcSpuTotals();
        populateDomainSelects();
        populateAbilityAssignSelect();
        renderDomains();
        renderSummary();
      }
    });
    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    homieRosterList.appendChild(card);
  });
}

// ============== Panel 3: Domains ==============

const domainList = document.getElementById("domain-list");
const domainFilterInput = document.getElementById("domain-filter-input");

function createDomainFromForm() {
  try {
    const name = document.getElementById("domain-name").value || "Unnamed Domain";
    const tier = clamp(Number(document.getElementById("domain-tier").value) || 1, 1, 10);
    const spuInvested = Math.max(0, Number(document.getElementById("domain-spu").value) || 0);
    const size = document.getElementById("domain-size").value || "";
    const fearDC = Number(document.getElementById("domain-fear-dc").value) || 0;
    const personality = document.getElementById("domain-personality").value || "";
    const lairActions = document.getElementById("domain-lair-actions").value || "";
    const notes = document.getElementById("domain-notes").value || "";

    const territorySelect = document.getElementById("domain-territory-homies");
    const assignedHomieIds = Array.from(territorySelect.selectedOptions).map((o) => o.value);

    const domain = {
      id: generateId("domain"),
      name,
      tier,
      spuInvested,
      size,
      fearDC,
      personality,
      lairActions,
      notes,
      homieIds: assignedHomieIds,
    };

    state.domains.push(domain);
    saveState();
    recalcSpuTotals();
    populateDomainSelects();
    populateAbilityAssignSelect();
    renderDomains();
    renderSummary();
  } catch (err) {
    showError("Failed to create domain.", err);
  }
}

async function generateDomainLairActions(domain) {
  try {
    const payload = {
      mode: "domainLair",
      domain,
      souls: state.souls,
      homies: state.homies,
    };
    const aiResult = await callSoulAI(payload);
    if (!aiResult || !aiResult.structured) {
      throw new Error("AI did not return structured lair actions.");
    }
    domain.lairActions = aiResult.structured.lairActions || aiResult.text || "";
    saveState();
    renderDomains();
    renderSummary();
  } catch (err) {
    showError(`Failed to generate lair actions for ${domain.name}.`, err);
  }
}

function renderDomains() {
  if (!domainList) return;
  domainList.innerHTML = "";
  const filter = (domainFilterInput.value || "").toLowerCase().trim();
  const domains = state.domains.filter((d) => {
    if (!filter) return true;
    return d.name && d.name.toLowerCase().includes(filter);
  });

  if (!domains.length) {
    domainList.classList.add("empty-message");
    domainList.innerHTML = "<p>No Domains match that filter yet.</p>";
    return;
  }
  domainList.classList.remove("empty-message");

  domains.forEach((d) => {
    const card = document.createElement("div");
    card.className = "entity-card";

    const header = document.createElement("div");
    header.className = "entity-card-header";

    const title = document.createElement("div");
    title.className = "entity-card-title";
    title.textContent = d.name;

    const tags = document.createElement("div");
    tags.className = "entity-tags";

    const tTier = document.createElement("span");
    tTier.className = "tag domain";
    tTier.textContent = `Tier ${d.tier}`;
    tags.appendChild(tTier);

    const tSpu = document.createElement("span");
    tSpu.className = "tag spu";
    tSpu.textContent = `${d.spuInvested} SPU`;
    tags.appendChild(tSpu);

    const tFear = document.createElement("span");
    tFear.className = "tag";
    tFear.textContent = `Fear DC ${d.fearDC}`;
    tags.appendChild(tFear);

    header.appendChild(title);
    header.appendChild(tags);

    const body = document.createElement("div");
    body.className = "entity-card-body";

    const left = document.createElement("div");
    left.className = "entity-card-section";
    const homieNames = d.homieIds
      .map((id) => state.homies.find((h) => h.id === id))
      .filter(Boolean)
      .map((h) => h.name);
    left.innerHTML = `
      <div><strong>Control Radius:</strong> ${d.size || "—"}</div>
      <div><strong>Personality:</strong> ${d.personality || "—"}</div>
      <div><strong>Territory Homies:</strong> ${homieNames.join(", ") || "—"}</div>
    `;

    const right = document.createElement("div");
    right.className = "entity-card-section";
    const lairLabel = document.createElement("div");
    lairLabel.innerHTML = "<strong>Lair Actions:</strong>";
    const lairArea = document.createElement("textarea");
    lairArea.className = "auto-resize";
    lairArea.value = d.lairActions || "";
    lairArea.addEventListener("input", () => {
      d.lairActions = lairArea.value;
      autoResizeTextarea(lairArea);
      saveState();
    });
    autoResizeTextarea(lairArea);

    const notesLabel = document.createElement("div");
    notesLabel.innerHTML = "<strong>Notes:</strong>";
    const notesArea = document.createElement("textarea");
    notesArea.className = "auto-resize";
    notesArea.value = d.notes || "";
    notesArea.addEventListener("input", () => {
      d.notes = notesArea.value;
      autoResizeTextarea(notesArea);
      saveState();
    });
    autoResizeTextarea(notesArea);

    right.appendChild(lairLabel);
    right.appendChild(lairArea);
    right.appendChild(notesLabel);
    right.appendChild(notesArea);

    body.appendChild(left);
    body.appendChild(right);

    const footer = document.createElement("div");
    footer.className = "entity-card-footer";

    const aiBtn = document.createElement("button");
    aiBtn.className = "btn small secondary";
    aiBtn.textContent = "AI: Generate / Reroll Lair Actions";
    aiBtn.addEventListener("click", () => generateDomainLairActions(d));
    footer.appendChild(aiBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small outline";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const idx = state.domains.findIndex((x) => x.id === d.id);
      if (idx >= 0) {
        state.domains.splice(idx, 1);
        saveState();
        recalcSpuTotals();
        populateDomainSelects();
        populateAbilityAssignSelect();
        renderDomains();
        renderSummary();
      }
    });
    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    domainList.appendChild(card);
  });

  setupAutoResize();
}

// ============== Panel 4: Abilities ==============

const abilityList = document.getElementById("ability-list");
const abilityFilterInput = document.getElementById("ability-filter-input");

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
    (el) => el.value
  );
}

function createAbility(manualFields) {
  const {
    name,
    assignTo,
    actionType,
    range,
    target,
    saveDC,
    damage,
    powerLevel,
    soulCost,
    effectTypes,
    effectNotes,
    outcomeTypes,
    outcomeNotes,
    mechanicalEffect,
    comboNotes,
    origin,
  } = manualFields;

  const ability = {
    id: generateId("ability"),
    name: name || "Unnamed Ability",
    assignTo: assignTo || "General / Party",
    actionType,
    range,
    target,
    saveDC,
    damage,
    powerLevel,
    soulCost,
    effectTypes,
    effectNotes,
    outcomeTypes,
    outcomeNotes,
    mechanicalEffect,
    comboNotes,
    origin: origin || "Manual",
  };

  state.abilities.push(ability);
  saveState();
  renderAbilities();
  renderSummary();
}

function createAbilityFromForm(origin = "Manual") {
  try {
    const name = document.getElementById("ability-name").value;
    const assignTo = document.getElementById("ability-assign-to").value;
    const actionType = document.getElementById("ability-action-type").value;
    const range = document.getElementById("ability-range").value;
    const target = document.getElementById("ability-target").value;
    const saveDC = document.getElementById("ability-save-dc").value;
    const damage = document.getElementById("ability-damage").value;
    const powerLevel = Number(document.getElementById("ability-power-level").value) || 0;
    const soulCost = Number(document.getElementById("ability-soul-cost").value) || 0;
    const effectTypes = getCheckedValues("ability-effect-types");
    const effectNotes = document.getElementById("ability-effect-notes").value;
    const outcomeTypes = getCheckedValues("ability-outcome-types");
    const outcomeNotes = document.getElementById("ability-outcome-notes").value;
    const mechanicalEffect = document.getElementById("ability-mechanical-effect").value;
    const comboNotes = document.getElementById("ability-combo-notes").value;

    createAbility({
      name,
      assignTo,
      actionType,
      range,
      target,
      saveDC,
      damage,
      powerLevel,
      soulCost,
      effectTypes,
      effectNotes,
      outcomeTypes,
      outcomeNotes,
      mechanicalEffect,
      comboNotes,
      origin,
    });
  } catch (err) {
    showError("Failed to create ability.", err);
  }
}

async function createAbilityViaAI() {
  try {
    const assignTo = document.getElementById("ability-assign-to").value;
    const powerLevel = Number(document.getElementById("ability-power-level").value) || 0;
    const soulCost = Number(document.getElementById("ability-soul-cost").value) || 0;
    const effectTypes = getCheckedValues("ability-effect-types");
    const outcomeTypes = getCheckedValues("ability-outcome-types");
    const effectNotes = document.getElementById("ability-effect-notes").value;
    const outcomeNotes = document.getElementById("ability-outcome-notes").value;
    const extraNotes = document.getElementById("ability-combo-notes").value;

    const payload = {
      mode: "genericAbility",
      assignTo,
      powerLevel,
      soulCost,
      effectTypes,
      outcomeTypes,
      effectNotes,
      outcomeNotes,
      extraNotes,
      souls: state.souls,
      homies: state.homies,
      domains: state.domains,
    };

    const aiResult = await callSoulAI(payload);
    if (!aiResult || !aiResult.structured) {
      throw new Error("AI did not return structured ability data.");
    }
    const ab = aiResult.structured;

    document.getElementById("ability-name").value = ab.abilityName || assignTo + " Soul Technique";
    document.getElementById("ability-action-type").value = ab.actionType || "Action";
    document.getElementById("ability-range").value = ab.range || "";
    document.getElementById("ability-target").value = ab.target || "";
    document.getElementById("ability-save-dc").value = ab.saveDC || "";
    document.getElementById("ability-damage").value = ab.damageDice || "";
    document.getElementById("ability-mechanical-effect").value =
      ab.mechanicalEffect || aiResult.text || "";
    document.getElementById("ability-combo-notes").value = ab.comboNotes || "";

    autoResizeTextarea(document.getElementById("ability-mechanical-effect"));
    autoResizeTextarea(document.getElementById("ability-combo-notes"));

    createAbilityFromForm("AI");
  } catch (err) {
    showError("Failed to generate ability via AI.", err);
  }
}

async function generateHomieAttackViaAI() {
  try {
    const targetId = document.getElementById("ai-homie-target").value;
    if (!targetId) {
      showError("Please select a Homie for the AI attack.", null);
      return;
    }
    const homie = state.homies.find((h) => h.id === targetId);
    if (!homie) {
      showError("Selected Homie not found.", null);
      return;
    }
    const concept = document.getElementById("ai-homie-concept").value || "";
    const effectTypes = getCheckedValues("ai-homie-effect-types");
    const powerLevel = Number(document.getElementById("ai-homie-power-level").value) || 0;

    const payload = {
      mode: "homieAttack",
      homie,
      concept,
      effectTypes,
      powerLevel,
      souls: state.souls,
      homies: state.homies,
      domains: state.domains,
    };

    const aiResult = await callSoulAI(payload);
    if (!aiResult || !aiResult.structured) {
      throw new Error("AI did not return structured Homie attack data.");
    }
    const ab = aiResult.structured;

    createAbility({
      name: ab.abilityName || `${homie.name} Soul Technique`,
      assignTo: homie.name,
      actionType: ab.actionType || "Action",
      range: ab.range || "",
      target: ab.target || "",
      saveDC: ab.saveDC || "",
      damage: ab.damageDice || "",
      powerLevel,
      soulCost: 0,
      effectTypes: effectTypes || [],
      effectNotes: concept || "",
      outcomeTypes: [],
      outcomeNotes: "",
      mechanicalEffect: ab.mechanicalEffect || aiResult.text || "",
      comboNotes: ab.comboNotes || "",
      origin: "AI Homie Attack",
    });
  } catch (err) {
    showError("Failed to generate Homie attack via AI.", err);
  }
}

function renderAbilities() {
  if (!abilityList) return;
  abilityList.innerHTML = "";
  const filter = (abilityFilterInput.value || "").toLowerCase().trim();

  const abilities = state.abilities.filter((a) => {
    if (!filter) return true;
    const matchIn =
      (a.name && a.name.toLowerCase().includes(filter)) ||
      (a.assignTo && a.assignTo.toLowerCase().includes(filter)) ||
      (a.mechanicalEffect && a.mechanicalEffect.toLowerCase().includes(filter));
    return matchIn;
  });

  if (!abilities.length) {
    abilityList.classList.add("empty-message");
    abilityList.innerHTML = "<p>No abilities match that filter yet.</p>";
    return;
  }
  abilityList.classList.remove("empty-message");

  abilities.forEach((a) => {
    const card = document.createElement("div");
    card.className = "entity-card";

    const header = document.createElement("div");
    header.className = "entity-card-header";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = a.name;
    titleInput.className = "entity-card-title";
    titleInput.addEventListener("input", () => {
      a.name = titleInput.value;
      saveState();
      renderSummary();
    });

    const tags = document.createElement("div");
    tags.className = "entity-tags";
    const tagAssign = document.createElement("span");
    tagAssign.className = "tag";
    tagAssign.textContent = a.assignTo || "General";
    tags.appendChild(tagAssign);
    const tagOrigin = document.createElement("span");
    tagOrigin.className = "tag";
    tagOrigin.textContent = a.origin || "Manual";
    tags.appendChild(tagOrigin);

    header.appendChild(titleInput);
    header.appendChild(tags);

    const body = document.createElement("div");
    body.className = "entity-card-body single-column";

    const section = document.createElement("div");
    section.className = "entity-card-section";

    const metaLine = document.createElement("div");
    metaLine.innerHTML = `<strong>${a.actionType || "Action"}</strong> • Range ${
      a.range || "—"
    } • Target ${a.target || "—"} • Save ${a.saveDC || "—"} • Damage ${a.damage || "—"}`;
    section.appendChild(metaLine);

    const effectLine = document.createElement("div");
    effectLine.innerHTML = `<strong>Effect Types:</strong> ${
      (a.effectTypes || []).join(", ") || "—"
    }`;
    section.appendChild(effectLine);

    const mechLabel = document.createElement("div");
    mechLabel.innerHTML = "<strong>Mechanical Effect:</strong>";
    const mechArea = document.createElement("textarea");
    mechArea.className = "auto-resize";
    mechArea.value = a.mechanicalEffect || "";
    mechArea.addEventListener("input", () => {
      a.mechanicalEffect = mechArea.value;
      autoResizeTextarea(mechArea);
      saveState();
    });
    autoResizeTextarea(mechArea);

    const comboLabel = document.createElement("div");
    comboLabel.innerHTML = "<strong>Combo / Interaction:</strong>";
    const comboArea = document.createElement("textarea");
    comboArea.className = "auto-resize";
    comboArea.value = a.comboNotes || "";
    comboArea.addEventListener("input", () => {
      a.comboNotes = comboArea.value;
      autoResizeTextarea(comboArea);
      saveState();
    });
    autoResizeTextarea(comboArea);

    section.appendChild(mechLabel);
    section.appendChild(mechArea);
    section.appendChild(comboLabel);
    section.appendChild(comboArea);
    body.appendChild(section);

    const footer = document.createElement("div");
    footer.className = "entity-card-footer";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn small secondary";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const text = `${a.name}
Assigned To: ${a.assignTo}
Action: ${a.actionType || "Action"} | Range: ${a.range || "—"} | Target: ${a.target || "—"}
Save/DC: ${a.saveDC || "—"} | Damage: ${a.damage || "—"}
Effect Types: ${(a.effectTypes || []).join(", ") || "—"}

Mechanical Effect:
${a.mechanicalEffect || ""}

Combo / Interaction:
${a.comboNotes || ""}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        showError("Unable to copy ability text to clipboard.", err);
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn small outline";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      const idx = state.abilities.findIndex((x) => x.id === a.id);
      if (idx >= 0) {
        state.abilities.splice(idx, 1);
        saveState();
        renderAbilities();
        renderSummary();
      }
    });

    footer.appendChild(copyBtn);
    footer.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    abilityList.appendChild(card);
  });

  setupAutoResize();
}

// ============== Panel 5: Summary Dashboard ==============

const summaryList = document.getElementById("summary-list");

function renderSummary() {
  if (!summaryList) return;
  summaryList.innerHTML = "";

  const entries = [];

  state.homies.forEach((h) => {
    entries.push({
      id: h.id,
      kind: "Homie",
      name: h.name,
      ac: h.ac,
      hp: h.hp,
      move: h.move,
      spu: h.totalSPUInvested,
      extra: h.role,
      notesKey: "summaryNotes",
      ref: h,
    });
  });

  state.domains.forEach((d) => {
    entries.push({
      id: d.id,
      kind: "Domain",
      name: d.name,
      ac: null,
      hp: null,
      move: d.size,
      spu: d.spuInvested,
      extra: `Tier ${d.tier}, Fear DC ${d.fearDC}`,
      notesKey: "summaryNotes",
      ref: d,
    });
  });

  if (!entries.length) {
    summaryList.classList.add("empty-message");
    summaryList.innerHTML = "<p>No Homies or Domains yet.</p>";
    return;
  }

  summaryList.classList.remove("empty-message");

  entries.forEach((e) => {
    const card = document.createElement("div");
    card.className = "summary-card";

    const header = document.createElement("div");
    header.className = "summary-header";

    const nameEl = document.createElement("div");
    nameEl.textContent = e.name;

    const tags = document.createElement("div");
    tags.className = "summary-tags";
    const tagKind = document.createElement("span");
    tagKind.className = "tag";
    tagKind.textContent = e.kind;
    tags.appendChild(tagKind);

    if (e.kind === "Homie") {
      const t = document.createElement("span");
      t.className = "tag homie";
      t.textContent = "Ally / Homie";
      tags.appendChild(t);
    } else if (e.kind === "Domain") {
      const t = document.createElement("span");
      t.className = "tag domain";
      t.textContent = "Domain";
      tags.appendChild(t);
    }

    const spuTag = document.createElement("span");
    spuTag.className = "tag spu";
    spuTag.textContent = `${e.spu || 0} SPU`;
    tags.appendChild(spuTag);

    header.appendChild(nameEl);
    header.appendChild(tags);

    const statsLine = document.createElement("div");
    statsLine.className = "summary-line";
    if (e.kind === "Homie") {
      statsLine.innerHTML = `
        <span><strong>AC:</strong> ${e.ac || "—"}</span>
        <span><strong>HP:</strong> ${e.hp || "—"}</span>
        <span><strong>Move:</strong> ${e.move || "—"}</span>
        <span><strong>Role:</strong> ${e.extra || "—"}</span>
      `;
    } else {
      statsLine.innerHTML = `
        <span><strong>Tier / Fear:</strong> ${e.extra || "—"}</span>
        <span><strong>Control Radius:</strong> ${e.move || "—"}</span>
      `;
    }

    const abilitySummary = document.createElement("div");
    abilitySummary.className = "summary-line";
    const relatedAbilities = state.abilities.filter((a) => {
      if (e.kind === "Homie") return a.assignTo === e.name;
      if (e.kind === "Domain") return a.assignTo === `Domain: ${e.name}`;
      return false;
    });
    const names = relatedAbilities.map((a) => a.name);
    abilitySummary.innerHTML = `<span><strong>Abilities:</strong> ${
      names.join(", ") || "—"
    }</span>`;

    const notesLabel = document.createElement("div");
    notesLabel.textContent = "Notes / At-a-Glance Reminders:";

    const notesArea = document.createElement("textarea");
    notesArea.className = "auto-resize summary-notes";
    notesArea.value = e.ref[e.notesKey] || "";
    notesArea.addEventListener("input", () => {
      e.ref[e.notesKey] = notesArea.value;
      autoResizeTextarea(notesArea);
      saveState();
    });
    autoResizeTextarea(notesArea);

    card.appendChild(header);
    card.appendChild(statsLine);
    card.appendChild(abilitySummary);
    card.appendChild(notesLabel);
    card.appendChild(notesArea);
    summaryList.appendChild(card);
  });

  setupAutoResize();
}

// ============== AI integration ==============

async function callSoulAI(payload) {
  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      throw new Error("Failed to parse AI response JSON: " + parseErr.message);
    }

    if (!data || !data.success) {
      throw new Error(data && data.error ? data.error : "Unknown AI error.");
    }
    return data;
  } catch (err) {
    showError("AI request failed: " + err.message, err);
    throw err;
  }
}

// ============== Global controls ==============

function setupGlobalButtons() {
  const saveBtn = document.getElementById("btn-save");
  const resetBtn = document.getElementById("btn-reset");
  const printBtn = document.getElementById("btn-print");
  const refreshSummaryBtn = document.getElementById("btn-refresh-summary");

  saveBtn?.addEventListener("click", () => {
    saveState();
  });

  resetBtn?.addEventListener("click", () => {
    if (confirm("Reset all data and clear localStorage?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  printBtn?.addEventListener("click", () => {
    window.print();
  });

  refreshSummaryBtn?.addEventListener("click", () => {
    renderSummary();
  });
}

// ============== Event wiring ==============

function setupEventHandlers() {
  document.getElementById("btn-recalc-soul")?.addEventListener("click", calculateSoulFromInputs);
  document.getElementById("btn-add-soul")?.addEventListener("click", addSoulToBank);
  soulFilterInput?.addEventListener("input", renderSoulBank);

  document.getElementById("btn-create-homie")?.addEventListener("click", createHomieFromForm);
  homieFilterInput?.addEventListener("input", renderHomies);
  document
    .getElementById("btn-generate-homie-attack")
    ?.addEventListener("click", generateHomieAttackViaAI);

  document.getElementById("btn-create-domain")?.addEventListener("click", createDomainFromForm);
  domainFilterInput?.addEventListener("input", renderDomains);

  document
    .getElementById("btn-create-ability-manual")
    ?.addEventListener("click", () => createAbilityFromForm("Manual"));
  document
    .getElementById("btn-create-ability-ai")
    ?.addEventListener("click", createAbilityViaAI);
  abilityFilterInput?.addEventListener("input", renderAbilities);
}

// ============== Initialize ==============

function init() {
  try {
    loadState();
    setupPanelToggles();
    setupAutoResize();
    setupGlobalButtons();
    setupEventHandlers();
    calculateSoulFromInputs();

    renderSoulBank();
    renderHomies();
    renderDomains();
    renderAbilities();
    renderSummary();

    populateSoulSelects();
    populateDomainSelects();
    populateAbilityAssignSelect();
    recalcSpuTotals();
  } catch (err) {
    showError("Initialization failed. Some features may not work.", err);
  }
}

document.addEventListener("DOMContentLoaded", init);

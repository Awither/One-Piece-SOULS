// =========================================
// Soul–Soul Fruit Control Panel
// Main client-side logic
// =========================================

/* 
  Global state
  (kept very close to your original structure)
*/
let Souls = [];
let Homies = [];
let Domains = [];
let Abilities = []; // All ability cards (manual + AI)
let LastAbilityAIInput = null;
let LastLairAIInput = null;

// -----------------------------------------
// Utility: safe DOM helpers
// -----------------------------------------
function $(sel) {
  return document.querySelector(sel);
}
function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

// -----------------------------------------
// Error / status banner
// -----------------------------------------
const appErrorBanner = document.getElementById("app-error-banner");
const appErrorText = document.getElementById("app-error-text");
const appErrorClose = document.getElementById("app-error-close");

function showBanner(message, opts = {}) {
  if (!appErrorBanner || !appErrorText) {
    console.log("Banner:", message);
    return;
  }
  const { type = "success", sticky = false } = opts;
  appErrorBanner.classList.remove("hidden", "error");
  if (type === "error") {
    appErrorBanner.classList.add("error");
  }
  appErrorText.textContent = message;

  if (!sticky) {
    setTimeout(() => {
      appErrorBanner.classList.add("hidden");
    }, 4000);
  }
}

if (appErrorClose) {
  appErrorClose.addEventListener("click", () => {
    appErrorBanner.classList.add("hidden");
  });
}

// -----------------------------------------
// LocalStorage persistence
// -----------------------------------------
const STORAGE_KEY = "soul_soul_workshop_v3";

function saveAll() {
  try {
    const payload = {
      souls: Souls,
      homies: Homies,
      domains: Domains,
      abilities: Abilities
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save:", err);
  }
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Souls = Array.isArray(data.souls) ? data.souls : [];
    Homies = Array.isArray(data.homies) ? data.homies : [];
    Domains = Array.isArray(data.domains) ? data.domains : [];
    Abilities = Array.isArray(data.abilities) ? data.abilities : [];
  } catch (err) {
    console.error("Failed to load:", err);
  }
}

function uuid() {
  return (
    "id_" +
    Math.random().toString(16).slice(2) +
    "_" +
    Date.now().toString(16)
  );
}

// -----------------------------------------
// Tabs
// -----------------------------------------
function initTabs() {
  const tabButtons = $all(".tab-button[data-panel]");
  const panels = $all(".panel[data-panel-id]");
  if (!tabButtons.length || !panels.length) return;

  function activate(panelName) {
    panels.forEach((panel) => {
      const id = panel.dataset.panelId;
      panel.classList.toggle("visible", id === panelName);
    });
    tabButtons.forEach((btn) => {
      const target = btn.dataset.panel;
      btn.classList.toggle("active", target === panelName);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.panel;
      if (target) {
        activate(target);
      }
    });
  });

  // Default: Souls tab, else first tab
  const defaultPanel = "souls";
  const hasSouls = tabButtons.some((b) => b.dataset.panel === defaultPanel);
  const initial = hasSouls
    ? defaultPanel
    : tabButtons[0]
    ? tabButtons[0].dataset.panel
    : null;

  if (initial) activate(initial);
}

// -----------------------------------------
// Auto-expand textareas (no scrollbars)
// -----------------------------------------
function autoExpand(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + 2 + "px";
}

function initTextareaAutoExpand() {
  $all("textarea").forEach((t) => {
    autoExpand(t);
    t.addEventListener("input", () => autoExpand(t));
  });
}

// =========================================
// Panel 1 – Souls
// =========================================

function initSoulsPanel() {
  const nameEl = $("#soul-name");
  const mightEl = $("#soul-might");
  const tierEl = $("#soul-tier");
  const willEl = $("#soul-will");
  const tagsEl = $("#soul-tags");
  const notesEl = $("#soul-notes");

  const ratingEl = $("#soul-rating");
  const levelEl = $("#soul-level");
  const spuEl = $("#soul-spu");
  const hpEl = $("#soul-hp");

  const recalcBtn = $("#btn-recalc-soul");
  const addBtn = $("#btn-add-soul");
  const bankList = $("#soul-bank-list");
  const filterInput = $("#soul-filter");

  if (!nameEl || !bankList) return; // panel not present

  function calculateSoul() {
    const might = parseInt(mightEl.value, 10) || 0;
    const tier = parseInt(tierEl.value, 10) || 0;
    const will = parseInt(willEl.value, 10) || 0;

    const combined = might * 2 + tier * 3 + will * 5;
    const SoL = Math.max(1, Math.floor(combined / 10));
    const SPU = Math.floor(combined * 8.5);
    const HP = Math.floor(SoL * 2);

    if (ratingEl) ratingEl.textContent = combined;
    if (levelEl) levelEl.textContent = SoL;
    if (spuEl) spuEl.textContent = SPU;
    if (hpEl) hpEl.textContent = HP;

    return { combined, SoL, SPU, HP };
  }

  function renderSoulBank() {
    const filter = (filterInput?.value || "").toLowerCase();
    bankList.innerHTML = "";

    Souls.filter((soul) =>
      !filter ? true : soul.name.toLowerCase().includes(filter)
    ).forEach((soul) => {
      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = soul.name;

      const chips = document.createElement("div");
      chips.className = "ability-card-tags";
      const levelChip = document.createElement("span");
      levelChip.className = "chip";
      levelChip.textContent = `SoL ${soul.level}`;
      const spuChip = document.createElement("span");
      spuChip.className = "chip";
      spuChip.textContent = `${soul.spu} SPU`;
      chips.append(levelChip, spuChip);

      header.append(title, chips);
      card.appendChild(header);

      const body = document.createElement("div");
      body.style.fontSize = "0.78rem";
      body.innerHTML =
        `<div><span class="stat-label">Rating:</span> ${soul.rating}</div>` +
        `<div><span class="stat-label">HP Lost:</span> ${soul.hp}</div>` +
        (soul.tags
          ? `<div><span class="stat-label">Traits:</span> ${soul.tags}</div>`
          : "") +
        (soul.notes
          ? `<div><span class="stat-label">Notes:</span> ${soul.notes}</div>`
          : "");
      card.appendChild(body);

      const footer = document.createElement("div");
      footer.className = "card-footer-row";

      const delBtn = document.createElement("button");
      delBtn.className = "btn secondary";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Souls = Souls.filter((s) => s.id !== soul.id);
        saveAll();
        renderSoulBank();
        refreshLinkedSoulOptions();
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      bankList.appendChild(card);
    });

    refreshLinkedSoulOptions();
  }

  if (recalcBtn) {
    recalcBtn.addEventListener("click", () => {
      calculateSoul();
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const { combined, SoL, SPU, HP } = calculateSoul();
      const soul = {
        id: uuid(),
        name: nameEl.value.trim() || "Unnamed Soul",
        might: parseInt(mightEl.value, 10) || 0,
        tier: parseInt(tierEl.value, 10) || 0,
        will: parseInt(willEl.value, 10) || 0,
        rating: combined,
        level: SoL,
        spu: SPU,
        hp: HP,
        tags: tagsEl.value.trim(),
        notes: notesEl.value.trim()
      };
      Souls.push(soul);
      saveAll();
      renderSoulBank();
      refreshLinkedSoulOptions();
      showBanner("Soul added to bank ✓");
    });
  }

  if (filterInput) {
    filterInput.addEventListener("input", () => renderSoulBank());
  }

  // initial values
  calculateSoul();
  renderSoulBank();
}

// -----------------------------------------
// Shared dropdown refresh
// -----------------------------------------

function refreshLinkedSoulOptions() {
  const linkedSoulSelects = $all("[data-soul-options]");
  linkedSoulSelects.forEach((select) => {
    const prev = select.value;
    select.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "— None —";
    select.appendChild(emptyOpt);

    Souls.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.spu} SPU)`;
      select.appendChild(opt);
    });
    if (prev) select.value = prev;
  });
}

function refreshHomieOptions() {
  const homieSelects = $all("[data-homie-options]");
  homieSelects.forEach((select) => {
    const prev = select.value;
    select.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "— None —";
    select.appendChild(emptyOpt);

    Homies.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = `${h.name} (HP ${h.hp}, AC ${h.ac})`;
      select.appendChild(opt);
    });
    if (prev) select.value = prev;
  });
}

function refreshDomainOptions() {
  const domainSelects = $all("[data-domain-options]");
  domainSelects.forEach((select) => {
    const prev = select.value;
    select.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "— None —";
    select.appendChild(emptyOpt);

    Domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      select.appendChild(opt);
    });
    if (prev) select.value = prev;
  });
}

// =========================================
// Panel 2 – Homies
// =========================================

function initHomiesPanel() {
  const nameEl = $("#homie-name");
  const typeEl = $("#homie-type");
  const linkedSoulEl = $("#homie-linked-soul");
  const spuEl = $("#homie-spu");
  const roleEl = $("#homie-role");
  const hpEl = $("#homie-hp");
  const acEl = $("#homie-ac");
  const moveEl = $("#homie-move");
  const attackEl = $("#homie-attack");
  const personalityEl = $("#homie-personality");
  const locationEl = $("#homie-location");
  const domainEl = $("#homie-domain");
  const notesEl = $("#homie-support");

  const createBtn = $("#btn-create-homie");
  const rosterList = $("#homie-roster-list");
  const rosterFilter = $("#homie-filter");

  if (!nameEl || !rosterList) return; // panel missing

  function renderHomies() {
    const filter = (rosterFilter?.value || "").toLowerCase();
    rosterList.innerHTML = "";

    Homies.filter((h) =>
      !filter ? true : h.name.toLowerCase().includes(filter)
    ).forEach((h) => {
      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = h.name;

      const tags = document.createElement("div");
      tags.className = "ability-card-tags";
      const typeChip = document.createElement("span");
      typeChip.className = "chip";
      typeChip.textContent = h.type || "Homie";
      const roleChip = document.createElement("span");
      roleChip.className = "chip";
      roleChip.textContent = h.role || "Role N/A";
      tags.append(typeChip, roleChip);

      header.append(title, tags);
      card.appendChild(header);

      const body = document.createElement("div");
      body.style.fontSize = "0.78rem";
      body.innerHTML =
        `<div><span class="stat-label">HP:</span> ${h.hp || "—"} &nbsp;` +
        `<span class="stat-label">AC:</span> ${h.ac || "—"} &nbsp;` +
        `<span class="stat-label">Move:</span> ${h.move || "—"}</div>` +
        (h.attack
          ? `<div><span class="stat-label">Primary Attack:</span> ${h.attack}</div>`
          : "") +
        (h.personality
          ? `<div><span class="stat-label">Personality:</span> ${h.personality}</div>`
          : "") +
        (h.location
          ? `<div><span class="stat-label">Location:</span> ${h.location}</div>`
          : "") +
        (h.notes
          ? `<div><span class="stat-label">Notes:</span> ${h.notes}</div>`
          : "");
      card.appendChild(body);

      const footer = document.createElement("div");
      footer.className = "card-footer-row";

      const delBtn = document.createElement("button");
      delBtn.className = "btn secondary";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Homies = Homies.filter((x) => x.id !== h.id);
        saveAll();
        renderHomies();
        refreshHomieOptions();
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      rosterList.appendChild(card);
    });

    refreshHomieOptions();
  }

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      const homie = {
        id: uuid(),
        name: nameEl.value.trim() || "Unnamed Homie",
        type: typeEl.value || "Homie",
        linkedSoulId: linkedSoulEl?.value || "",
        spu: parseInt(spuEl.value, 10) || 0,
        role: roleEl.value.trim(),
        hp: parseInt(hpEl.value, 10) || 0,
        ac: parseInt(acEl.value, 10) || 0,
        move: parseInt(moveEl.value, 10) || 0,
        attack: attackEl.value.trim(),
        personality: personalityEl.value.trim(),
        location: locationEl.value.trim(),
        domainId: domainEl?.value || "",
        notes: notesEl.value.trim()
      };
      Homies.push(homie);
      saveAll();
      renderHomies();
      refreshHomieOptions();
      showBanner("Homie added ✓");
    });
  }

  if (rosterFilter) {
    rosterFilter.addEventListener("input", () => renderHomies());
  }

  renderHomies();
}

// =========================================
// Abilities – helpers to parse text into card meta
// =========================================

function parseAbilityText(rawText) {
  const meta = {
    action: "—",
    range: "—",
    target: "—",
    save: "—",
    damage: "—",
    summary: "",
    effect: rawText || "",
    combo: ""
  };
  if (!rawText) return meta;

  const getFieldLine = (labels) => {
    const pattern =
      "(?:^|\\n)\\s*(?:" +
      labels.map((l) => l.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|") +
      ")\\s*[:=]\\s*([^\\n]+)";
    const re = new RegExp(pattern, "i");
    const m = rawText.match(re);
    return m ? m[1].trim() : "";
  };

  meta.action = getFieldLine(["Action", "Action Type"]) || "—";
  meta.range = getFieldLine(["Range"]) || "—";
  meta.target = getFieldLine(["Target"]) || "—";
  const saveLine =
    getFieldLine(["Save", "Save/DC", "Saving Throw"]) || "—";
  meta.save = saveLine;
  meta.damage = getFieldLine(["Damage", "Damage / Effect"]) || "—";

  // Effect & summary
  let effectSection = rawText;
  const effMatch = rawText.match(
    /(Effect|Description)\s*[:=]\s*([\s\S]*)/i
  );
  if (effMatch) {
    effectSection = effMatch[2].trim();
  }

  const comboMatch = effectSection.match(/Combo\s*[:=]\s*([\s\S]*)/i);
  if (comboMatch) {
    meta.combo = comboMatch[1].trim();
    effectSection = effectSection.replace(comboMatch[0], "").trim();
  }

  const firstSentenceMatch = effectSection.match(
    /(.+?[.!?])(\s|$)/
  );
  if (firstSentenceMatch) {
    meta.summary = firstSentenceMatch[1].trim();
  } else {
    meta.summary = effectSection.slice(0, 160).trim();
  }
  meta.effect = effectSection;

  return meta;
}

// =========================================
// Panel 3 – Abilities
// =========================================

function initAbilitiesPanel() {
  const manualName = $("#manual-ability-name");
  const manualPower = $("#manual-ability-power");
  const manualShort = $("#manual-ability-short");
  const manualAction = $("#manual-ability-action");
  const manualRange = $("#manual-ability-range");
  const manualTarget = $("#manual-ability-target");
  const manualSave = $("#manual-ability-save");
  const manualDC = $("#manual-ability-dc");
  const manualDamage = $("#manual-ability-damage");
  const manualEffect = $("#manual-ability-effect");
  const manualCombo = $("#manual-ability-combo");
  const manualAssign = $("#manual-ability-assign");

  const manualSaveBtn = $("#btn-manual-ability-save");

  const aiPower = $("#ai-ability-power");
  const aiRole = $("#ai-ability-role");
  const aiPrompt = $("#ai-ability-prompt");
  const aiAssign = $("#ai-ability-assign");
  const aiGenerateBtn = $("#btn-ai-ability-generate");
  const aiRerollBtn = $("#btn-ai-ability-reroll");

  const abilityFilter = $("#ability-filter");
  const abilityList = $("#ability-list");

  if (!abilityList) return; // panel may not exist yet

  // ---- Save manual ability ----
  if (manualSaveBtn && manualName) {
    manualSaveBtn.addEventListener("click", () => {
      const textParts = [];

      if (manualAction.value)
        textParts.push(`Action: ${manualAction.value}`);
      if (manualRange.value)
        textParts.push(`Range: ${manualRange.value}`);
      if (manualTarget.value)
        textParts.push(`Target: ${manualTarget.value}`);
      if (manualSave.value || manualDC.value)
        textParts.push(
          `Save/DC: ${manualSave.value || ""} ${
            manualDC.value ? "DC " + manualDC.value : ""
          }`.trim()
        );
      if (manualDamage.value)
        textParts.push(`Damage: ${manualDamage.value}`);
      if (manualShort.value)
        textParts.push(`Description: ${manualShort.value}`);
      if (manualEffect.value)
        textParts.push(`Effect: ${manualEffect.value}`);
      if (manualCombo.value)
        textParts.push(`Combo: ${manualCombo.value}`);

      const rawText = textParts.join("\n");

      const ability = {
        id: uuid(),
        name: manualName.value.trim() || "Unnamed Ability",
        power: parseInt(manualPower.value, 10) || null,
        role: null,
        assignToType: inferAssignType(manualAssign?.value),
        assignToId: manualAssign?.value || "",
        rawText
      };

      Abilities.push(ability);
      saveAll();
      renderAbilityList();
      showBanner("Ability saved ✓");
    });
  }

  // ---- AI ability generation ----
  if (aiGenerateBtn && aiPrompt) {
    aiGenerateBtn.addEventListener("click", async () => {
      const concept = aiPrompt.value.trim();
      const power = parseInt(aiPower?.value, 10) || 7;
      const role = aiRole?.value || "Offense";

      if (!concept) {
        showBanner("Enter a concept / what you want first.", {
          type: "error"
        });
        return;
      }

      LastAbilityAIInput = { concept, power, role, assignValue: aiAssign?.value || "" };

      try {
        aiGenerateBtn.disabled = true;
        aiGenerateBtn.textContent = "Generating…";

        const res = await fetch("/api/generate-soul-abilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "abilityCard", // uses your existing endpoint; if unsupported it will just fall back to plain text handling
            concept,
            power,
            role,
            souls: Souls,
            homies: Homies,
            domains: Domains
          })
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        const text =
          (typeof data === "string"
            ? data
            : data.text || data.ability || data.result) || "";

        const ability = {
          id: uuid(),
          name: data.name || "Unnamed Ability",
          power,
          role,
          assignToType: inferAssignType(aiAssign?.value),
          assignToId: aiAssign?.value || "",
          rawText: text || concept
        };
        Abilities.push(ability);
        saveAll();
        renderAbilityList();
        showBanner("AI ability generated ✓");
      } catch (err) {
        console.error(err);
        showBanner("AI ability generation failed.", { type: "error" });
      } finally {
        aiGenerateBtn.disabled = false;
        aiGenerateBtn.textContent = "Generate Ability";
      }
    });
  }

  // ---- Reroll last ability ----
  if (aiRerollBtn) {
    aiRerollBtn.addEventListener("click", () => {
      if (!LastAbilityAIInput) {
        showBanner("Generate at least one AI ability first.", {
          type: "error"
        });
        return;
      }
      if (aiPrompt && LastAbilityAIInput.concept) {
        aiPrompt.value = LastAbilityAIInput.concept;
      }
      if (aiPower && LastAbilityAIInput.power) {
        aiPower.value = LastAbilityAIInput.power;
      }
      if (aiRole && LastAbilityAIInput.role) {
        aiRole.value = LastAbilityAIInput.role;
      }
      if (aiAssign && LastAbilityAIInput.assignValue) {
        aiAssign.value = LastAbilityAIInput.assignValue;
      }
      aiGenerateBtn?.click();
    });
  }

  // ---- Filter ----
  if (abilityFilter) {
    abilityFilter.addEventListener("input", () => renderAbilityList());
  }

  // ---- Render list ----
  function renderAbilityList() {
    if (!abilityList) return;
    const filter = (abilityFilter?.value || "").toLowerCase();

    abilityList.innerHTML = "";

    Abilities.filter((a) =>
      !filter ? true : (a.name || "").toLowerCase().includes(filter)
    ).forEach((ability) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-card-header";

      const title = document.createElement("div");
      title.className = "ability-card-title";
      title.textContent = ability.name || "Unnamed Ability";

      const tagRow = document.createElement("div");
      tagRow.className = "ability-card-tags";

      if (ability.power != null) {
        const powerChip = document.createElement("span");
        powerChip.className = "chip power";
        powerChip.textContent = `Pwr ${ability.power}`;
        tagRow.appendChild(powerChip);
      }

      if (ability.role) {
        const roleChip = document.createElement("span");
        roleChip.className = "chip role";
        roleChip.textContent = ability.role;
        tagRow.appendChild(roleChip);
      }

      if (ability.assignToType && ability.assignToId) {
        const chip = document.createElement("span");
        chip.className = "chip assignee";
        chip.textContent =
          ability.assignToType === "homie"
            ? "Homie ability"
            : ability.assignToType === "domain"
            ? "Domain feature"
            : "General";
        tagRow.appendChild(chip);
      }

      header.append(title, tagRow);
      card.appendChild(header);

      const meta = parseAbilityText(ability.rawText || ability.text || "");

      const summary = document.createElement("div");
      summary.className = "ability-card-summary";
      summary.textContent = meta.summary;
      card.appendChild(summary);

      const metaRow = document.createElement("div");
      metaRow.className = "ability-card-meta";

      const addMetaItem = (label, value) => {
        const wrap = document.createElement("div");
        const lab = document.createElement("div");
        lab.className = "ability-meta-label";
        lab.textContent = label;
        const val = document.createElement("div");
        val.className = "ability-meta-value";
        val.textContent = value || "—";
        wrap.append(lab, val);
        metaRow.appendChild(wrap);
      };

      addMetaItem("Action", meta.action);
      addMetaItem("Range", meta.range);
      addMetaItem("Target", meta.target);
      addMetaItem("Save / DC", meta.save);
      addMetaItem("Damage", meta.damage);

      card.appendChild(metaRow);

      const effectDiv = document.createElement("div");
      effectDiv.className = "ability-card-effect";
      effectDiv.textContent = meta.effect;
      card.appendChild(effectDiv);

      if (meta.combo) {
        const comboDiv = document.createElement("div");
        comboDiv.className = "ability-card-combo";
        comboDiv.textContent = "Combo: " + meta.combo;
        card.appendChild(comboDiv);
      }

      const footer = document.createElement("div");
      footer.className = "card-footer-row";

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn secondary";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(ability.rawText || ability.text || "")
          .then(() => showBanner("Ability copied to clipboard ✓"))
          .catch(() =>
            showBanner("Copy failed (clipboard not available).", {
              type: "error"
            })
          );
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        Abilities = Abilities.filter((x) => x.id !== ability.id);
        saveAll();
        renderAbilityList();
      });

      footer.append(copyBtn, deleteBtn);
      card.appendChild(footer);

      abilityList.appendChild(card);
    });
  }

  renderAbilityList();
}

// Helper to interpret assign select
function inferAssignType(value) {
  if (!value) return null;
  if (value.startsWith("homie:")) return "homie";
  if (value.startsWith("domain:")) return "domain";
  if (value === "general") return "general";
  return null;
}

// =========================================
// Panel 4 – Domains & Lair Actions
// =========================================

function initDomainsPanel() {
  const nameEl = $("#domain-name");
  const tierEl = $("#domain-tier");
  const spuEl = $("#domain-spu");
  const dcEl = $("#domain-dc");
  const rangeEl = $("#domain-range");
  const personalityEl = $("#domain-personality");
  const notesEl = $("#domain-notes");
  const homiesSelect = $("#domain-homies");

  const saveDomainBtn = $("#btn-create-domain");
  const domainFilter = $("#domain-filter");
  const domainOverviewList = $("#domain-list");

  // Lair AI
  const lairDomainSelect = $("#lair-domain");
  const lairPowerEl = $("#lair-power");
  const lairCountEl = $("#lair-count");
  const lairPromptEl = $("#lair-prompt");
  const lairGenerateBtn = $("#btn-lair-generate");
  const lairRerollBtn = $("#btn-lair-reroll");
  const lairCardList = $("#lair-card-list");

  if (!nameEl || !domainOverviewList) return;

  function renderDomains() {
    const filter = (domainFilter?.value || "").toLowerCase();
    domainOverviewList.innerHTML = "";

    Domains.filter((d) =>
      !filter ? true : d.name.toLowerCase().includes(filter)
    ).forEach((d) => {
      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = d.name;

      const tags = document.createElement("div");
      tags.className = "ability-card-tags";

      const tierChip = document.createElement("span");
      tierChip.className = "chip";
      tierChip.textContent = `Tier ${d.tier || "—"}`;

      const fearChip = document.createElement("span");
      fearChip.className = "chip";
      fearChip.textContent = `Fear DC ${d.dc || "—"}`;

      const rangeChip = document.createElement("span");
      rangeChip.className = "chip";
      rangeChip.textContent = d.range || "Range —";

      tags.append(tierChip, fearChip, rangeChip);
      header.append(title, tags);
      card.appendChild(header);

      const body = document.createElement("div");
      body.style.fontSize = "0.78rem";

      body.innerHTML =
        (d.personality
          ? `<div><span class="stat-label">Personality:</span> ${d.personality}</div>`
          : "") +
        (d.notes
          ? `<div><span class="stat-label">Notes:</span> ${d.notes}</div>`
          : "") +
        (Array.isArray(d.homies) && d.homies.length
          ? `<div><span class="stat-label">Territory Homies:</span> ${d.homies
              .map((hid) => {
                const h = Homies.find((x) => x.id === hid);
                return h ? h.name : "Unknown";
              })
              .join(", ")}</div>`
          : "");

      card.appendChild(body);

      const footer = document.createElement("div");
      footer.className = "card-footer-row";

      const delBtn = document.createElement("button");
      delBtn.className = "btn secondary";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Domains = Domains.filter((x) => x.id !== d.id);
        saveAll();
        renderDomains();
        refreshDomainOptions();
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      domainOverviewList.appendChild(card);
    });

    refreshDomainOptions();
  }

  if (saveDomainBtn) {
    saveDomainBtn.addEventListener("click", () => {
      const selectedHomies = [];
      if (homiesSelect) {
        Array.from(homiesSelect.selectedOptions).forEach((opt) => {
          if (opt.value) selectedHomies.push(opt.value);
        });
      }

      const domain = {
        id: uuid(),
        name: nameEl.value.trim() || "Unnamed Domain",
        tier: parseInt(tierEl.value, 10) || 1,
        spu: parseInt(spuEl.value, 10) || 0,
        dc: parseInt(dcEl.value, 10) || 10,
        range: rangeEl.value.trim(),
        personality: personalityEl.value.trim(),
        notes: notesEl.value.trim(),
        homies: selectedHomies,
        lairCards: [] // array of {id, name, power, domainId, rawText}
      };
      Domains.push(domain);
      saveAll();
      renderDomains();
      refreshDomainOptions();
      showBanner("Domain saved ✓");
    });
  }

  if (domainFilter) {
    domainFilter.addEventListener("input", () => renderDomains());
  }

  // ----- Lair cards -----

  function renderLairCards() {
    if (!lairCardList) return;
    lairCardList.innerHTML = "";

    Domains.forEach((domain) => {
      if (!Array.isArray(domain.lairCards) || !domain.lairCards.length) return;

      domain.lairCards.forEach((cardData) => {
        const card = document.createElement("div");
        card.className = "ability-card";

        const header = document.createElement("div");
        header.className = "ability-card-header";

        const title = document.createElement("div");
        title.className = "ability-card-title";
        title.textContent =
          cardData.name || `${domain.name} Lair Action`;

        const tags = document.createElement("div");
        tags.className = "ability-card-tags";

        const powerChip = document.createElement("span");
        powerChip.className = "chip power";
        powerChip.textContent = `Pwr ${cardData.power || 10}`;

        const domainChip = document.createElement("span");
        domainChip.className = "chip assignee";
        domainChip.textContent = `Domain: ${domain.name}`;

        tags.append(powerChip, domainChip);
        header.append(title, tags);
        card.appendChild(header);

        const meta = parseAbilityText(cardData.rawText || "");

        const summary = document.createElement("div");
        summary.className = "ability-card-summary";
        summary.textContent =
          meta.summary || cardData.shortSummary || "";
        card.appendChild(summary);

        const metaRow = document.createElement("div");
        metaRow.className = "ability-card-meta";
        const addMetaItem = (label, value) => {
          const wrap = document.createElement("div");
          const lab = document.createElement("div");
          lab.className = "ability-meta-label";
          lab.textContent = label;
          const val = document.createElement("div");
          val.className = "ability-meta-value";
          val.textContent = value || "—";
          wrap.append(lab, val);
          metaRow.appendChild(wrap);
        };
        addMetaItem("Action", meta.action);
        addMetaItem("Range", meta.range);
        addMetaItem("Target", meta.target);
        addMetaItem("Save / DC", meta.save);
        addMetaItem("Damage", meta.damage);
        card.appendChild(metaRow);

        const effectDiv = document.createElement("div");
        effectDiv.className = "ability-card-effect";
        effectDiv.textContent = meta.effect;
        card.appendChild(effectDiv);

        if (meta.combo) {
          const comboDiv = document.createElement("div");
          comboDiv.className = "ability-card-combo";
          comboDiv.textContent = "Combo: " + meta.combo;
          card.appendChild(comboDiv);
        }

        const footer = document.createElement("div");
        footer.className = "card-footer-row";

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn secondary";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard
            .writeText(cardData.rawText || "")
            .then(() => showBanner("Lair action copied ✓"))
            .catch(() =>
              showBanner("Copy failed (clipboard not available).", {
                type: "error"
              })
            );
        });

        const delBtn = document.createElement("button");
        delBtn.className = "btn danger";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          domain.lairCards = domain.lairCards.filter(
            (x) => x.id !== cardData.id
          );
          saveAll();
          renderLairCards();
        });

        footer.append(copyBtn, delBtn);
        card.appendChild(footer);

        lairCardList.appendChild(card);
      });
    });
  }

  if (lairGenerateBtn && lairDomainSelect && lairPowerEl && lairCountEl) {
    lairGenerateBtn.addEventListener("click", async () => {
      const domainId = lairDomainSelect.value;
      const domain = Domains.find((d) => d.id === domainId);
      const power = parseInt(lairPowerEl.value, 10) || 10;
      const count = Math.max(1, parseInt(lairCountEl.value, 10) || 1);
      const extra = lairPromptEl?.value.trim() || "";

      if (!domain) {
        showBanner("Pick a domain for the lair actions.", {
          type: "error"
        });
        return;
      }

      LastLairAIInput = {
        domainId,
        power,
        count,
        extra
      };

      try {
        lairGenerateBtn.disabled = true;
        lairGenerateBtn.textContent = "Generating…";

        const res = await fetch("/api/generate-soul-abilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "domainLairs",
            domain,
            power,
            count,
            extra
          })
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const text =
          (typeof data === "string"
            ? data
            : data.text || data.result || "") || "";

        // Split into actions by "Name:" markers if present
        const parts = text
          .split(/(?:^|\n)Name\s*[:=]/i)
          .map((p) => p.trim())
          .filter(Boolean);

        if (!Array.isArray(domain.lairCards)) domain.lairCards = [];

        if (parts.length > 0) {
          parts.forEach((chunk) => {
            const nameMatch = chunk.match(/^([^\n]+)\n/);
            const name = nameMatch ? nameMatch[1].trim() : "Lair Action";
            const rawText =
              "Name: " +
              chunk; /* ensures parseAbilityText has same info */

            domain.lairCards.push({
              id: uuid(),
              name,
              power,
              domainId: domain.id,
              rawText
            });
          });
        } else {
          // fallback: single big block
          domain.lairCards.push({
            id: uuid(),
            name: `${domain.name} Lair Action`,
            power,
            domainId: domain.id,
            rawText: text
          });
        }

        saveAll();
        renderLairCards();
        showBanner("AI lair actions generated ✓");
      } catch (err) {
        console.error(err);
        showBanner("AI lair generation failed.", { type: "error" });
      } finally {
        lairGenerateBtn.disabled = false;
        lairGenerateBtn.textContent = "Generate Lair Actions";
      }
    });
  }

  if (lairRerollBtn) {
    lairRerollBtn.addEventListener("click", () => {
      if (!LastLairAIInput) {
        showBanner("Generate lair actions at least once first.", {
          type: "error"
        });
        return;
      }
      const { domainId, power, count, extra } = LastLairAIInput;
      if (lairDomainSelect && domainId) lairDomainSelect.value = domainId;
      if (lairPowerEl && power) lairPowerEl.value = power;
      if (lairCountEl && count) lairCountEl.value = count;
      if (lairPromptEl && extra) lairPromptEl.value = extra;
      lairGenerateBtn?.click();
    });
  }

  renderDomains();
  renderLairCards();
}

// =========================================
// Panel 5 – Playable View (accordion style)
// =========================================

function initPlayablePanel() {
  const homieList = $("#play-homies");
  const domainList = $("#play-domains");
  const allAbilitiesList = $("#play-abilities");

  if (!homieList || !domainList || !allAbilitiesList) return;

  // Homies with dropdown of abilities assigned to them
  homieList.innerHTML = "";
  Homies.forEach((h) => {
    const acc = document.createElement("div");
    acc.className = "accordion";

    const header = document.createElement("div");
    header.className = "accordion-header";

    const title = document.createElement("div");
    title.className = "accordion-title";
    title.textContent = h.name;

    const meta = document.createElement("div");
    meta.className = "accordion-meta";
    meta.textContent = `HP ${h.hp || "—"}  AC ${h.ac || "—"}  Move ${
      h.move || "—"
    }`;

    const chevron = document.createElement("div");
    chevron.className = "accordion-chevron";
    chevron.textContent = "▾";

    header.append(title, meta, chevron);
    acc.appendChild(header);

    const body = document.createElement("div");
    body.className = "accordion-body";

    const coreLine = document.createElement("div");
    coreLine.style.fontSize = "0.78rem";
    coreLine.innerHTML =
      (h.role ? `<div><b>Role:</b> ${h.role}</div>` : "") +
      (h.attack ? `<div><b>Attack:</b> ${h.attack}</div>` : "");
    body.appendChild(coreLine);

    const abilHeader = document.createElement("div");
    abilHeader.style.marginTop = "0.4rem";
    abilHeader.style.fontSize = "0.8rem";
    abilHeader.style.fontWeight = "600";
    abilHeader.textContent = "Abilities";
    body.appendChild(abilHeader);

    const abilCards = document.createElement("div");
    abilCards.className = "card-list ability-card-list";

    Abilities.filter(
      (a) =>
        a.assignToType === "homie" &&
        a.assignToId &&
        a.assignToId.includes(h.id)
    ).forEach((a) => {
      const metaObj = parseAbilityText(a.rawText || a.text || "");
      const smallCard = document.createElement("div");
      smallCard.className = "ability-card";

      const header2 = document.createElement("div");
      header2.className = "ability-card-header";

      const title2 = document.createElement("div");
      title2.className = "ability-card-title";
      title2.textContent = a.name || "Ability";

      const tags2 = document.createElement("div");
      tags2.className = "ability-card-tags";

      if (a.power != null) {
        const chip = document.createElement("span");
        chip.className = "chip power";
        chip.textContent = `Pwr ${a.power}`;
        tags2.appendChild(chip);
      }

      header2.append(title2, tags2);
      smallCard.appendChild(header2);

      const summary = document.createElement("div");
      summary.className = "ability-card-summary";
      summary.textContent = metaObj.summary;
      smallCard.appendChild(summary);

      abilCards.appendChild(smallCard);
    });

    if (!abilCards.children.length) {
      const noAbil = document.createElement("div");
      noAbil.style.fontSize = "0.74rem";
      noAbil.style.color = "#9ba0e6";
      noAbil.textContent = "No abilities assigned yet.";
      abilCards.appendChild(noAbil);
    }

    body.appendChild(abilCards);
    acc.appendChild(body);

    header.addEventListener("click", () => {
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "block" : "none";
      chevron.textContent = isHidden ? "▾" : "▸";
    });

    // start collapsed
    body.style.display = "none";
    chevron.textContent = "▸";

    homieList.appendChild(acc);
  });

  // Domains with lair actions
  domainList.innerHTML = "";
  Domains.forEach((d) => {
    const acc = document.createElement("div");
    acc.className = "accordion";

    const header = document.createElement("div");
    header.className = "accordion-header";

    const title = document.createElement("div");
    title.className = "accordion-title";
    title.textContent = d.name;

    const meta = document.createElement("div");
    meta.className = "accordion-meta";
    meta.textContent = `Tier ${d.tier || "—"}  Fear DC ${
      d.dc || "—"
    }  Range ${d.range || "—"}`;

    const chevron = document.createElement("div");
    chevron.className = "accordion-chevron";
    chevron.textContent = "▾";

    header.append(title, meta, chevron);
    acc.appendChild(header);

    const body = document.createElement("div");
    body.className = "accordion-body";

    if (d.personality) {
      const p = document.createElement("div");
      p.style.fontSize = "0.78rem";
      p.style.marginBottom = "0.25rem";
      p.innerHTML = `<b>Personality:</b> ${d.personality}`;
      body.appendChild(p);
    }

    const lairHeader = document.createElement("div");
    lairHeader.style.fontSize = "0.8rem";
    lairHeader.style.fontWeight = "600";
    lairHeader.textContent = "Lair Actions";
    body.appendChild(lairHeader);

    const lairList = document.createElement("div");
    lairList.className = "card-list ability-card-list";

    (d.lairCards || []).forEach((lc) => {
      const metaObj = parseAbilityText(lc.rawText || "");
      const mini = document.createElement("div");
      mini.className = "ability-card";

      const h2 = document.createElement("div");
      h2.className = "ability-card-header";

      const t2 = document.createElement("div");
      t2.className = "ability-card-title";
      t2.textContent = lc.name || "Lair Action";

      const tags = document.createElement("div");
      tags.className = "ability-card-tags";

      if (lc.power != null) {
        const chip = document.createElement("span");
        chip.className = "chip power";
        chip.textContent = `Pwr ${lc.power}`;
        tags.appendChild(chip);
      }

      h2.append(t2, tags);
      mini.appendChild(h2);

      const summary = document.createElement("div");
      summary.className = "ability-card-summary";
      summary.textContent = metaObj.summary;
      mini.appendChild(summary);

      lairList.appendChild(mini);
    });

    if (!lairList.children.length) {
      const noLair = document.createElement("div");
      noLair.style.fontSize = "0.74rem";
      noLair.style.color = "#9ba0e6";
      noLair.textContent = "No lair actions yet.";
      lairList.appendChild(noLair);
    }

    body.appendChild(lairList);
    acc.appendChild(body);

    header.addEventListener("click", () => {
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "block" : "none";
      chevron.textContent = isHidden ? "▾" : "▸";
    });

    body.style.display = "none";
    chevron.textContent = "▸";

    domainList.appendChild(acc);
  });

  // All abilities flat list
  allAbilitiesList.innerHTML = "";
  Abilities.forEach((a) => {
    const meta = parseAbilityText(a.rawText || a.text || "");
    const card = document.createElement("div");
    card.className = "ability-card";

    const header = document.createElement("div");
    header.className = "ability-card-header";

    const title = document.createElement("div");
    title.className = "ability-card-title";
    title.textContent = a.name || "Ability";

    const tags = document.createElement("div");
    tags.className = "ability-card-tags";
    if (a.power != null) {
      const chip = document.createElement("span");
      chip.className = "chip power";
      chip.textContent = `Pwr ${a.power}`;
      tags.appendChild(chip);
    }
    header.append(title, tags);
    card.appendChild(header);

    const summary = document.createElement("div");
    summary.className = "ability-card-summary";
    summary.textContent = meta.summary;
    card.appendChild(summary);

    allAbilitiesList.appendChild(card);
  });
}

// =========================================
// Init
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  initTabs();
  initTextareaAutoExpand();

  initSoulsPanel();
  initHomiesPanel();
  initAbilitiesPanel();
  initDomainsPanel();
  initPlayablePanel();

  // Keep dropdowns synced on load
  refreshLinkedSoulOptions();
  refreshHomieOptions();
  refreshDomainOptions();
});

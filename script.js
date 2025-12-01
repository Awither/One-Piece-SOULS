// script.js – Soul-Soul Fruit Control Panel (tabbed, card-based UI)
// This version:
// - Keeps your existing purple/blue theme and card structure
// - Makes Playable View live-updating
// - Makes ability assignment actually stick
// - Shows structured cards in Playable View for homies & domains

"use strict";

// ---------- State & persistence ----------

const STORAGE_KEY = "soul_soul_workshop_v2";

const state = {
  souls: [],
  homies: [],
  domains: [],
  abilities: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.souls)) state.souls = parsed.souls;
    if (Array.isArray(parsed.homies)) state.homies = parsed.homies;
    if (Array.isArray(parsed.domains)) state.domains = parsed.domains;
    if (Array.isArray(parsed.abilities)) state.abilities = parsed.abilities;

    // Ensure lairActions arrays exist
    state.domains.forEach((d) => {
      if (!Array.isArray(d.lairActions)) d.lairActions = [];
    });
  } catch (err) {
    console.error("Failed to load state:", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

// Simple id helper
function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Tab navigation ----------

function initTabs() {
  const tabButtons = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll(".tab-panel");

  function activateTab(tab) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.tab === tab);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab);
    });
  });

  // Default home = Souls
  activateTab("souls");
}

// ---------- Helpers for assignment ----------

function buildAssignOptions(selectedType, selectedId) {
  // Value format: type:id  (general has id = "")
  const options = [];

  options.push(
    `<option value="general:" ${
      selectedType === "general" ? "selected" : ""
    }>General / Party</option>`
  );

  if (state.homies.length) {
    options.push(`<optgroup label="Homies">`);
    state.homies.forEach((h) => {
      const value = `homie:${h.id}`;
      const label = `Homie – ${h.name || "Unnamed"}`;
      const selected =
        selectedType === "homie" && selectedId === h.id ? "selected" : "";
      options.push(`<option value="${value}" ${selected}>${label}</option>`);
    });
    options.push(`</optgroup>`);
  }

  if (state.domains.length) {
    options.push(`<optgroup label="Domains">`);
    state.domains.forEach((d) => {
      const value = `domain:${d.id}`;
      const label = `Domain – ${d.name || "Unnamed"}`;
      const selected =
        selectedType === "domain" && selectedId === d.id ? "selected" : "";
      options.push(`<option value="${value}" ${selected}>${label}</option>`);
    });
    options.push(`</optgroup>`);
  }

  return options.join("");
}

function parseAssignValue(value) {
  const [type, id] = value.split(":");
  if (type === "homie" || type === "domain") {
    return { assignedType: type, assignedId: id || null };
  }
  return { assignedType: "general", assignedId: null };
}

function getAssignLabel(ability) {
  if (ability.assignedType === "homie") {
    const h = state.homies.find((x) => x.id === ability.assignedId);
    return h ? `Homie: ${h.name}` : "Homie";
  }
  if (ability.assignedType === "domain") {
    const d = state.domains.find((x) => x.id === ability.assignedId);
    return d ? `Domain: ${d.name}` : "Domain";
  }
  return "General";
}

// ---------- Soul Panel (Panel 1) ----------

function initSoulPanel() {
  const nameInput = document.getElementById("soul-name");
  const mightInput = document.getElementById("soul-might");
  const tierInput = document.getElementById("soul-tier");
  const willInput = document.getElementById("soul-will");
  const tagsInput = document.getElementById("soul-tags");
  const notesInput = document.getElementById("soul-notes");

  const combinedSpan = document.getElementById("soul-rating");
  const levelSpan = document.getElementById("soul-level");
  const spuSpan = document.getElementById("soul-spu");
  const hpSpan = document.getElementById("soul-hp");

  const recalcBtn = document.getElementById("btn-recalc-soul");
  const addBtn = document.getElementById("btn-add-soul");

  const filterInput = document.getElementById("soul-filter");
  const listEl = document.getElementById("soul-list");

  if (
    !nameInput ||
    !mightInput ||
    !tierInput ||
    !willInput ||
    !tagsInput ||
    !notesInput
  )
    return; // defensive if HTML changed

  function calcSoul() {
    const might = Number(mightInput.value) || 0;
    const tier = Number(tierInput.value) || 0;
    const will = Number(willInput.value) || 0;

    const combined = might * 2 + tier * 3 + will * 5;
    const level = Math.max(1, Math.floor(combined / 10));
    const spu = Math.floor(combined * 8.5);
    const hp = level * 2;

    combinedSpan.textContent = combined.toString();
    levelSpan.textContent = level.toString();
    spuSpan.textContent = spu.toString();
    hpSpan.textContent = hp.toString();

    return { combined, level, spu, hp };
  }

  function renderSoulList() {
    const filter = (filterInput.value || "").toLowerCase();
    listEl.innerHTML = "";

    state.souls
      .filter((s) =>
        (s.name || "").toLowerCase().includes(filter)
      )
      .forEach((soul) => {
        const card = document.createElement("div");
        card.className = "data-card";

        const title = document.createElement("div");
        title.className = "data-card-header";
        title.innerHTML = `<strong>${soul.name || "Unnamed Soul"}</strong>
          <span class="pill pill-small">SoL ${soul.level}</span>
          <span class="pill pill-small">${soul.spu} SPU</span>`;
        card.appendChild(title);

        const body = document.createElement("div");
        body.className = "data-card-body small";
        body.innerHTML = `
          <div class="inline-stats">
            <span>Might: ${soul.might}</span>
            <span>Tier: ${soul.tier}</span>
            <span>Will: ${soul.will}</span>
            <span>HP Lost: ${soul.hp}</span>
          </div>
          <div class="small-text">${soul.tags || ""}</div>
        `;
        card.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "data-card-footer right";
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger btn-sm";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          state.souls = state.souls.filter((x) => x.id !== soul.id);
          saveState();
          renderSoulList();
        });
        footer.appendChild(delBtn);
        card.appendChild(footer);

        listEl.appendChild(card);
      });
  }

  recalcBtn.addEventListener("click", (e) => {
    e.preventDefault();
    calcSoul();
  });

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const { combined, level, spu, hp } = calcSoul();
    if (!nameInput.value.trim()) return;

    const soul = {
      id: makeId("soul"),
      name: nameInput.value.trim(),
      might: Number(mightInput.value) || 0,
      tier: Number(tierInput.value) || 0,
      will: Number(willInput.value) || 0,
      rating: combined,
      level,
      spu,
      hp,
      tags: tagsInput.value.trim(),
      notes: notesInput.value.trim()
    };

    state.souls.push(soul);
    saveState();
    renderSoulList();
    renderAbilityPanel(); // in case dropdowns use souls
  });

  filterInput.addEventListener("input", renderSoulList);

  renderSoulList();
  calcSoul();
}

// ---------- Homies Panel (Panel 2) ----------

function initHomiePanel() {
  const form = document.getElementById("homie-form");
  const list = document.getElementById("homie-list");

  if (!form || !list) return;

  const nameInput = document.getElementById("homie-name");
  const typeInput = document.getElementById("homie-type");
  const linkedSoulSelect = document.getElementById("homie-linked-soul");
  const roleInput = document.getElementById("homie-role");
  const hpInput = document.getElementById("homie-hp");
  const acInput = document.getElementById("homie-ac");
  const moveInput = document.getElementById("homie-move");
  const attackInput = document.getElementById("homie-attack");
  const traitsInput = document.getElementById("homie-traits");
  const locationInput = document.getElementById("homie-location");
  const notesInput = document.getElementById("homie-notes");

  function refreshLinkedSoulOptions() {
    if (!linkedSoulSelect) return;
    const current = linkedSoulSelect.value;
    linkedSoulSelect.innerHTML =
      '<option value="">— None —</option>' +
      state.souls
        .map(
          (s) =>
            `<option value="${s.id}" ${
              s.id === current ? "selected" : ""
            }>${s.name} (${s.spu} SPU)</option>`
        )
        .join("");
  }

  function renderHomies() {
    refreshLinkedSoulOptions();
    list.innerHTML = "";

    state.homies.forEach((h) => {
      const card = document.createElement("div");
      card.className = "data-card";

      const soul =
        h.linkedSoulId &&
        state.souls.find((s) => s.id === h.linkedSoulId);

      const header = document.createElement("div");
      header.className = "data-card-header";
      header.innerHTML = `
        <strong>${h.name || "Unnamed Homie"}</strong>
        <span class="pill pill-small">${h.type || "Homie"}</span>
        <span class="pill pill-small">HP ${h.hp || "?"}</span>
        <span class="pill pill-small">AC ${h.ac || "?"}</span>
      `;
      card.appendChild(header);

      const body = document.createElement("div");
      body.className = "data-card-body small";
      body.innerHTML = `
        <div class="inline-stats">
          <span>Move: ${h.move || "—"}</span>
          <span>Role: ${h.role || "—"}</span>
          <span>Attack: ${h.attack || "—"}</span>
        </div>
        <div class="small-text">
          Linked Soul: ${
            soul ? `${soul.name} (${soul.spu} SPU)` : "—"
          }
        </div>
        <div class="small-text">${h.traits || ""}</div>
      `;
      card.appendChild(body);

      const footer = document.createElement("div");
      footer.className = "data-card-footer right";
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        state.homies = state.homies.filter((x) => x.id !== h.id);
        saveState();
        renderHomies();
        renderAbilityPanel();
        renderDomainPanel();
        renderPlayableView();
      });
      footer.appendChild(delBtn);
      card.appendChild(footer);

      list.appendChild(card);
    });

    renderAbilityPanel(); // keep assignment dropdowns fresh
    renderDomainPanel();
    renderPlayableView();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const homie = {
      id: makeId("homie"),
      name: nameInput.value.trim() || "Unnamed Homie",
      type: typeInput.value || "Homie",
      linkedSoulId: linkedSoulSelect.value || null,
      role: roleInput.value.trim(),
      hp: Number(hpInput.value) || 0,
      ac: Number(acInput.value) || 0,
      move: Number(moveInput.value) || 0,
      attack: attackInput.value.trim(),
      traits: traitsInput.value.trim(),
      location: locationInput.value.trim(),
      notes: notesInput.value.trim()
    };
    state.homies.push(homie);
    saveState();
    form.reset();
    renderHomies();
  });

  renderHomies();
}

// ---------- Ability Panel (Panel 3) ----------

async function callAbilityAI(payload) {
  const res = await fetch("/api/generate-soul-abilities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "AI ability generation failed");
  }
  return data;
}

function parseAbilityText(rawText) {
  const lines = rawText.split("\n").map((l) => l.trim());
  const ability = {
    name: "AI Ability",
    power: null,
    role: "",
    action: "",
    range: "",
    target: "",
    saveDc: "",
    damage: "",
    shortDescription: "",
    effect: rawText
  };

  let currentKey = null;
  const effectLines = [];

  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
    if (m) {
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      currentKey = key;

      switch (key) {
        case "name":
          ability.name = value || "AI Ability";
          break;
        case "power":
          ability.power = parseInt(value, 10) || null;
          break;
        case "role":
          ability.role = value;
          break;
        case "action":
          ability.action = value;
          break;
        case "range":
          ability.range = value;
          break;
        case "target":
          ability.target = value;
          break;
        case "save/dc":
        case "save":
        case "savedc":
          ability.saveDc = value;
          break;
        case "damage":
          ability.damage = value;
          break;
        case "description":
          ability.shortDescription = value;
          break;
        case "effect":
          // we'll accumulate following lines
          if (value) effectLines.push(value);
          break;
        default:
          break;
      }
    } else if (currentKey === "effect") {
      effectLines.push(line);
    }
  }

  if (effectLines.length) {
    ability.effect = effectLines.join(" ");
  }

  return ability;
}

function buildAbilityCardInnerHTML(ability, showAssignSelect = false) {
  const powerLabel =
    ability.power != null ? `Pwr ${ability.power}` : "Pwr ?";
  const assignLabel = getAssignLabel(ability);

  const topLine = `
    <div class="data-card-header">
      <strong>${ability.name || "Unnamed Ability"}</strong>
      <span class="pill pill-small">${powerLabel}</span>
      <span class="pill pill-small">${assignLabel}</span>
    </div>
  `;

  const statRow = `
    <div class="ability-stat-row">
      <span><strong>Action</strong><br>${ability.action || "—"}</span>
      <span><strong>Range</strong><br>${ability.range || "—"}</span>
      <span><strong>Target</strong><br>${ability.target || "—"}</span>
      <span><strong>Save / DC</strong><br>${ability.saveDc || "—"}</span>
      <span><strong>Damage</strong><br>${ability.damage || "—"}</span>
    </div>
  `;

  const desc = `
    <div class="small-text">${ability.shortDescription || ""}</div>
    <div class="ability-effect-text">${ability.effect || ""}</div>
  `;

  return topLine + statRow + desc;
}

function initAbilityPanel() {
  const manualForm = document.getElementById("manual-ability-form");
  const manualAssign = document.getElementById("manual-assign");

  const aiForm = document.getElementById("ai-ability-form");
  const aiPower = document.getElementById("ai-power");
  const aiRole = document.getElementById("ai-role");
  const aiConcept = document.getElementById("ai-concept");
  const aiAssign = document.getElementById("ai-assign");

  const list = document.getElementById("ability-list");
  const filterInput = document.getElementById("ability-filter");

  if (!list) return;

  function refreshAssignDropdowns() {
    if (manualAssign) {
      const v = manualAssign.value || "general:";
      manualAssign.innerHTML = buildAssignOptions("general", null);
      manualAssign.value = v;
    }
    if (aiAssign) {
      const v = aiAssign.value || "general:";
      aiAssign.innerHTML = buildAssignOptions("general", null);
      aiAssign.value = v;
    }
  }

  function renderAbilities() {
    refreshAssignDropdowns();
    list.innerHTML = "";

    const filter = (filterInput?.value || "").toLowerCase();

    state.abilities
      .filter((a) =>
        (a.name || "").toLowerCase().includes(filter)
      )
      .forEach((ability) => {
        const card = document.createElement("div");
        card.className = "data-card";

        const body = document.createElement("div");
        body.className = "data-card-body";

        // inner HTML for the card
        body.innerHTML = buildAbilityCardInnerHTML(ability, true);

        // assignment select
        const assignWrapper = document.createElement("div");
        assignWrapper.className = "assign-select-row";

        const label = document.createElement("span");
        label.textContent = "Assigned to:";
        assignWrapper.appendChild(label);

        const select = document.createElement("select");
        select.className = "assign-select";
        select.innerHTML = buildAssignOptions(
          ability.assignedType || "general",
          ability.assignedId || null
        );
        select.addEventListener("change", () => {
          const parsed = parseAssignValue(select.value);
          ability.assignedType = parsed.assignedType;
          ability.assignedId = parsed.assignedId;
          saveState();
          renderAbilities();
          renderPlayableView();
        });
        assignWrapper.appendChild(select);

        body.appendChild(assignWrapper);
        card.appendChild(body);

        // footer buttons
        const footer = document.createElement("div");
        footer.className = "data-card-footer right";

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-secondary btn-sm";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(
            `${ability.name}\n\n${ability.effect || ability.shortDescription}`
          );
        });

        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger btn-sm";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          state.abilities = state.abilities.filter(
            (x) => x.id !== ability.id
          );
          saveState();
          renderAbilities();
          renderPlayableView();
        });

        footer.appendChild(copyBtn);
        footer.appendChild(delBtn);
        card.appendChild(footer);

        list.appendChild(card);
      });

    renderPlayableView();
  }

  // Manual ability save
  if (manualForm) {
    manualForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("manual-name").value.trim();
      const power = Number(
        document.getElementById("manual-power").value || 0
      );
      const action =
        document.getElementById("manual-action").value.trim();
      const range =
        document.getElementById("manual-range").value.trim();
      const target =
        document.getElementById("manual-target").value.trim();
      const saveDc =
        document.getElementById("manual-save").value.trim();
      const damage =
        document.getElementById("manual-damage").value.trim();
      const shortDesc =
        document
          .getElementById("manual-short-desc")
          .value.trim() || "";
      const effect =
        document
          .getElementById("manual-effect")
          .value.trim() || shortDesc;

      const parsed = parseAssignValue(
        manualAssign ? manualAssign.value : "general:"
      );

      const ability = {
        id: makeId("ab"),
        name: name || "Unnamed Ability",
        power,
        role: "",
        action,
        range,
        target,
        saveDc,
        damage,
        shortDescription: shortDesc,
        effect,
        assignedType: parsed.assignedType,
        assignedId: parsed.assignedId
      };

      state.abilities.push(ability);
      saveState();
      manualForm.reset();
      renderAbilities();
    });
  }

  // AI ability generation
  if (aiForm) {
    aiForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!aiConcept.value.trim()) return;

      const parsedAssign = parseAssignValue(
        aiAssign ? aiAssign.value : "general:"
      );

      try {
        const payload = {
          mode: "abilityCard",
          concept: aiConcept.value.trim(),
          power: Number(aiPower.value) || 7,
          role: aiRole.value || "Offense",
          souls: state.souls,
          homies: state.homies,
          domains: state.domains
        };

        const data = await callAbilityAI(payload);
        const parsed = parseAbilityText(data.text);

        const ability = {
          id: makeId("ab"),
          name: parsed.name || data.name || "AI Ability",
          power: parsed.power ?? (Number(aiPower.value) || 7),
          role: parsed.role || aiRole.value || "",
          action: parsed.action,
          range: parsed.range,
          target: parsed.target,
          saveDc: parsed.saveDc,
          damage: parsed.damage,
          shortDescription: parsed.shortDescription,
          effect: parsed.effect,
          assignedType: parsedAssign.assignedType,
          assignedId: parsedAssign.assignedId
        };

        state.abilities.push(ability);
        saveState();
        renderAbilities();
      } catch (err) {
        console.error(err);
        alert("AI ability generation failed. Check console for details.");
      }
    });
  }

  if (filterInput) {
    filterInput.addEventListener("input", renderAbilities);
  }

  renderAbilities();
}

// ---------- Domain Panel (Panel 4) ----------

async function callDomainAI(payload) {
  const res = await fetch("/api/generate-soul-abilities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "AI lair generation failed");
  }
  return data;
}

function parseLairBlocks(rawText) {
  // Split on "Name:" to get multiple blocks
  const chunks = rawText
    .split(/\n(?=Name\s*:)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const base = parseAbilityText(chunk); // same parser works
    return {
      id: makeId("lair"),
      name: base.name,
      power: base.power,
      action: base.action || "Lair Action",
      range: base.range,
      target: base.target,
      saveDc: base.saveDc,
      damage: base.damage,
      shortDescription: base.shortDescription,
      effect: base.effect
    };
  });
}

function initDomainPanel() {
  const form = document.getElementById("domain-form");
  const overview = document.getElementById("domain-overview");

  const aiForm = document.getElementById("lair-ai-form");
  const aiDomainSelect = document.getElementById("lair-domain");
  const aiPower = document.getElementById("lair-power");
  const aiCount = document.getElementById("lair-count");
  const aiNotes = document.getElementById("lair-notes");
  const lairList = document.getElementById("lair-card-list");

  if (!form || !overview) return;

  const nameInput = document.getElementById("domain-name");
  const tierInput = document.getElementById("domain-tier");
  const spuInput = document.getElementById("domain-spu");
  const dcInput = document.getElementById("domain-dc");
  const rangeInput = document.getElementById("domain-range");
  const personalityInput = document.getElementById("domain-personality");
  const notesInput = document.getElementById("domain-notes");
  const homieSelect = document.getElementById("domain-homies");

  function refreshDomainSelect() {
    if (!aiDomainSelect) return;
    const current = aiDomainSelect.value;
    aiDomainSelect.innerHTML =
      "<option value=''>— Choose domain —</option>" +
      state.domains
        .map(
          (d) =>
            `<option value="${d.id}" ${
              d.id === current ? "selected" : ""
            }>${d.name}</option>`
        )
        .join("");
  }

  function refreshHomieMulti() {
    if (!homieSelect) return;
    const selected = Array.from(homieSelect.selectedOptions).map(
      (o) => o.value
    );
    homieSelect.innerHTML = state.homies
      .map(
        (h) =>
          `<option value="${h.id}" ${
            selected.includes(h.id) ? "selected" : ""
          }>${h.name} (HP ${h.hp || "?"}, AC ${h.ac || "?"})</option>`
      )
      .join("");
  }

  function renderDomains() {
    refreshDomainSelect();
    refreshHomieMulti();
    overview.innerHTML = "";

    state.domains.forEach((d) => {
      const card = document.createElement("div");
      card.className = "data-card";

      const header = document.createElement("div");
      header.className = "data-card-header";
      header.innerHTML = `
        <strong>${d.name || "Unnamed Domain"}</strong>
        <span class="pill pill-small">Tier ${d.tier || "?"}</span>
        <span class="pill pill-small">Fear DC ${d.dc || "?"}</span>
        <span class="pill pill-small">${d.range || "Range?"}</span>
      `;
      card.appendChild(header);

      const homieNames = (d.homieIds || [])
        .map((id) => {
          const h = state.homies.find((hh) => hh.id === id);
          return h ? h.name : null;
        })
        .filter(Boolean)
        .join(", ");

      const body = document.createElement("div");
      body.className = "data-card-body small";
      body.innerHTML = `
        <div class="small-text">
          Personality: ${d.personality || "—"}
        </div>
        <div class="small-text">
          Notes: ${d.notes || "—"}
        </div>
        <div class="small-text">
          Territory Homies: ${homieNames || "—"}
        </div>
      `;
      card.appendChild(body);

      const footer = document.createElement("div");
      footer.className = "data-card-footer right";
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        state.domains = state.domains.filter((x) => x.id !== d.id);
        saveState();
        renderDomains();
        renderAbilityPanel();
        renderPlayableView();
      });
      footer.appendChild(delBtn);
      card.appendChild(footer);

      overview.appendChild(card);
    });

    renderLairCards();
    renderPlayableView();
  }

  function renderLairCards() {
    if (!lairList) return;
    lairList.innerHTML = "";

    state.domains.forEach((d) => {
      (d.lairActions || []).forEach((la) => {
        const card = document.createElement("div");
        card.className = "data-card";

        const header = document.createElement("div");
        header.className = "data-card-header";
        header.innerHTML = `
          <strong>${la.name}</strong>
          <span class="pill pill-small">Pwr ${la.power ?? "?"}</span>
          <span class="pill pill-small">Domain: ${d.name}</span>
        `;
        card.appendChild(header);

        const body = document.createElement("div");
        body.className = "data-card-body";
        body.innerHTML = buildAbilityCardInnerHTML(la, false);
        card.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "data-card-footer right";
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-secondary btn-sm";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(
            `${la.name}\n\n${la.effect || la.shortDescription}`
          );
        });
        footer.appendChild(copyBtn);
        card.appendChild(footer);

        lairList.appendChild(card);
      });
    });

    renderPlayableView();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const homieIds = Array.from(homieSelect.selectedOptions).map(
      (o) => o.value
    );

    const domain = {
      id: makeId("domain"),
      name: nameInput.value.trim() || "Unnamed Domain",
      tier: Number(tierInput.value) || 0,
      spu: Number(spuInput.value) || 0,
      dc: Number(dcInput.value) || 0,
      range: rangeInput.value.trim(),
      personality: personalityInput.value.trim(),
      notes: notesInput.value.trim(),
      homieIds,
      lairActions: []
    };

    state.domains.push(domain);
    saveState();
    form.reset();
    renderDomains();
  });

  if (aiForm) {
    aiForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!aiDomainSelect.value) return;

      const domain = state.domains.find(
        (d) => d.id === aiDomainSelect.value
      );
      if (!domain) return;

      try {
        const payload = {
          mode: "domainLairs",
          domain,
          power: Number(aiPower.value) || 10,
          count: Number(aiCount.value) || 3,
          extra: aiNotes.value || ""
        };

        const data = await callDomainAI(payload);
        const lairs = parseLairBlocks(data.text);

        domain.lairActions = lairs;
        saveState();
        renderLairCards();
      } catch (err) {
        console.error(err);
        alert("AI lair generation failed. Check console for details.");
      }
    });
  }

  renderDomains();
}

// ---------- Playable View (Panel 5) ----------

function initPlayableView() {
  renderPlayableView(); // initial
}

function renderPlayableView() {
  const homieContainer = document.getElementById("play-homies");
  const domainContainer = document.getElementById("play-domains");

  if (!homieContainer || !domainContainer) return;

  homieContainer.innerHTML = "";
  domainContainer.innerHTML = "";

  // --- Homies section ---
  state.homies.forEach((h) => {
    const card = document.createElement("div");
    card.className = "data-card";

    const header = document.createElement("div");
    header.className = "data-card-header";
    header.innerHTML = `
      <strong>${h.name || "Homie"}</strong>
      <span class="pill pill-small">HP ${h.hp || "?"}</span>
      <span class="pill pill-small">AC ${h.ac || "?"}</span>
      <span class="pill pill-small">Move ${h.move || "?"}</span>
      <span class="pill pill-small">${h.role || "Support"}</span>
    `;
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "data-card-body small";
    body.innerHTML = `
      <div class="small-text">Attack: ${h.attack || "—"}</div>
      <div class="small-text">${h.traits || ""}</div>
    `;

    // Assigned abilities
    const abilitiesForHomie = state.abilities.filter(
      (a) =>
        (a.assignedType === "homie" && a.assignedId === h.id) ||
        a.assignedType === "general" ||
        !a.assignedType
    );

    if (abilitiesForHomie.length) {
      const subHeader = document.createElement("div");
      subHeader.className = "subsection-header";
      subHeader.textContent = "Abilities";
      body.appendChild(subHeader);

      abilitiesForHomie.forEach((ab) => {
        const abCard = document.createElement("div");
        abCard.className = "mini-ability-card";
        abCard.innerHTML = buildAbilityCardInnerHTML(ab, false);
        body.appendChild(abCard);
      });
    }

    card.appendChild(body);
    homieContainer.appendChild(card);
  });

  // --- Domains section ---
  state.domains.forEach((d) => {
    const card = document.createElement("div");
    card.className = "data-card";

    const header = document.createElement("div");
    header.className = "data-card-header";
    header.innerHTML = `
      <strong>${d.name || "Domain"}</strong>
      <span class="pill pill-small">Tier ${d.tier || "?"}</span>
      <span class="pill pill-small">Fear DC ${d.dc || "?"}</span>
      <span class="pill pill-small">${d.range || "Range?"}</span>
    `;
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "data-card-body small";
    body.innerHTML = `
      <div class="small-text">Personality: ${
        d.personality || "—"
      }</div>
      <div class="small-text">Notes: ${d.notes || "—"}</div>
    `;

    const lairs = d.lairActions || [];
    if (lairs.length) {
      const subHeader = document.createElement("div");
      subHeader.className = "subsection-header";
      subHeader.textContent = "Lair Actions";
      body.appendChild(subHeader);

      lairs.forEach((la) => {
        const laCard = document.createElement("div");
        laCard.className = "mini-ability-card";
        laCard.innerHTML = buildAbilityCardInnerHTML(la, false);
        body.appendChild(laCard);
      });
    }

    card.appendChild(body);
    domainContainer.appendChild(card);
  });
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTabs();
  initSoulPanel();
  initHomiePanel();
  initAbilityPanel();
  initDomainPanel();
  initPlayableView();
});

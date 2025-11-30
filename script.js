// ========= basic error banner =========
const errorBanner = document.getElementById("app-error-banner");
const errorText = document.getElementById("app-error-text");
const errorCloseBtn = document.getElementById("app-error-close");

let lastErrorAt = 0;
const ERROR_COOLDOWN_MS = 4000;

function showError(message, err) {
  console.error("[Soul-Soul]", message, err || "");
  if (errorText) errorText.textContent = message;
  if (errorBanner) errorBanner.classList.remove("hidden");

  lastErrorAt = Date.now();
  setTimeout(() => {
    if (Date.now() - lastErrorAt >= ERROR_COOLDOWN_MS) {
      errorBanner?.classList.add("hidden");
    }
  }, ERROR_COOLDOWN_MS + 300);
}

errorCloseBtn?.addEventListener("click", () => {
  errorBanner?.classList.add("hidden");
});

// ========= state & storage =========
const STORAGE_KEY = "one_piece_soul_soul_v1";

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
    state.souls = parsed.souls || [];
    state.homies = parsed.homies || [];
    state.domains = parsed.domains || [];
    state.abilities = parsed.abilities || [];
  } catch (e) {
    showError("Could not load saved data.", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    showError("Could not save data.", e);
  }
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ========= global SPU totals =========
function recalcSpuTotals() {
  const totalSPU = state.souls.reduce((sum, s) => sum + (s.spu || 0), 0);
  const homieSPU = state.homies.reduce((sum, h) => sum + (h.spu || 0), 0);
  const domainSPU = state.domains.reduce((sum, d) => sum + (d.spu || 0), 0);
  const spent = homieSPU + domainSPU;
  const available = Math.max(0, totalSPU - spent);

  document.getElementById("total-spu").textContent = totalSPU.toString();
  document.getElementById("spent-spu").textContent = spent.toString();
  document.getElementById("available-spu").textContent = available.toString();
}

// ========= souls panel =========
function calcSoulFromInputs() {
  const might = Number(document.getElementById("raw-might").value || 0);
  const tier = Number(document.getElementById("proficiency-tier").value || 0);
  const will = Number(document.getElementById("willpower-level").value || 0);

  const combined = might * 2 + tier * 3 + will * 5;
  const level = Math.max(1, Math.floor(combined / 10));
  const spu = Math.floor(combined * 8.5);
  const hpLost = Math.floor(level * 2);

  document.getElementById("combined-soul-rating").textContent = combined.toString();
  document.getElementById("soul-level").textContent = level.toString();
  document.getElementById("soul-energy").textContent = spu.toString();
  document.getElementById("soul-max-hp-lost").textContent = hpLost.toString();

  return { combined, level, spu, hpLost };
}

function addSoulToBank() {
  const name = document.getElementById("creature-name").value.trim();
  if (!name) {
    showError("Give the creature a name before adding the soul.");
    return;
  }
  const { combined, level, spu, hpLost } = calcSoulFromInputs();
  const traits = document.getElementById("soul-traits").value.trim();
  const notes = document.getElementById("soul-notes").value.trim();

  const soul = {
    id: generateId("soul"),
    name,
    rating: combined,
    level,
    spu,
    hpLost,
    traits,
    notes,
    available: true,
    immuneToday: false,
  };

  state.souls.push(soul);
  saveState();
  renderSoulBank();
  populateSoulSelects();
  recalcSpuTotals();
  showError("Soul added to bank ✓");
}

function toggleSoulFlag(id, key) {
  const s = state.souls.find((x) => x.id === id);
  if (!s) return;
  s[key] = !s[key];
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
  const container = document.getElementById("soul-bank-list");
  const filter = (document.getElementById("soul-filter").value || "").toLowerCase();
  container.innerHTML = "";

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
      header.className = "ability-header";

      const h4 = document.createElement("h4");
      h4.className = "ability-name";
      h4.textContent = soul.name;

      const pill = document.createElement("span");
      pill.className = "power-pill";
      pill.textContent = `SoL ${soul.level} • ${soul.spu} SPU`;

      header.appendChild(h4);
      header.appendChild(pill);

      const meta = document.createElement("div");
      meta.className = "ability-meta-row";
      meta.innerHTML = `
        <span><strong>Might/Tier/Will:</strong> ${soul.rating}</span>
        <span><strong>Max HP Lost:</strong> ${soul.hpLost}</span>
        <span><strong>Status:</strong> ${
          soul.available ? "Available" : "Spent / bound"
        }</span>
      `;

      const p = document.createElement("p");
      p.className = "ability-paragraph";
      p.innerHTML = `<strong>Traits:</strong> ${soul.traits || "—"}<br><strong>Notes:</strong> ${
        soul.notes || "—"
      }`;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-button-row";

      const btnAvail = document.createElement("button");
      btnAvail.className = "btn secondary";
      btnAvail.textContent = soul.available ? "Mark Spent" : "Mark Available";
      btnAvail.onclick = () => toggleSoulFlag(soul.id, "available");

      const btnImmune = document.createElement("button");
      btnImmune.className = "btn secondary";
      btnImmune.textContent = soul.immuneToday ? "Clear Soul-Rip Immune" : "Mark Soul-Rip Immune";
      btnImmune.onclick = () => toggleSoulFlag(soul.id, "immuneToday");

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.onclick = () => deleteSoul(soul.id);

      btnRow.append(btnAvail, btnImmune, btnDelete);

      card.append(header, meta, p, btnRow);
      container.appendChild(card);
    });
}

// ========= homies =========
function populateSoulSelects() {
  const select = document.getElementById("homie-linked-soul");
  if (!select) return;
  select.innerHTML = `<option value="">— None —</option>`;
  state.souls.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.spu} SPU)`;
    select.appendChild(opt);
  });
}

function createHomie() {
  const name = document.getElementById("homie-name").value.trim();
  if (!name) {
    showError("Give the Homie a name.");
    return;
  }

  const homie = {
    id: generateId("homie"),
    name,
    type: document.getElementById("homie-type").value,
    linkedSoulId: document.getElementById("homie-linked-soul").value || "",
    spu: Number(document.getElementById("homie-spu").value || 0),
    role: document.getElementById("homie-role").value.trim(),
    hp: Number(document.getElementById("homie-hp").value || 0),
    ac: Number(document.getElementById("homie-ac").value || 0),
    move: Number(document.getElementById("homie-move").value || 0),
    attack: document.getElementById("homie-attack").value.trim(),
    personality: document.getElementById("homie-personality").value.trim(),
    location: document.getElementById("homie-location").value.trim(),
    domainId: document.getElementById("homie-domain").value || "",
  };

  state.homies.push(homie);
  saveState();
  renderHomies();
  populateDomainSelects();
  populateAbilityAssignSelect();
  renderPlayable();
  recalcSpuTotals();
}

function deleteHomie(id) {
  state.homies = state.homies.filter((h) => h.id !== id);
  saveState();
  renderHomies();
  populateDomainSelects();
  populateAbilityAssignSelect();
  renderPlayable();
  recalcSpuTotals();
}

function renderHomies() {
  const container = document.getElementById("homie-roster");
  const filter = (document.getElementById("homie-filter").value || "").toLowerCase();
  container.innerHTML = "";

  state.homies
    .filter((h) => {
      if (!filter) return true;
      return (
        h.name.toLowerCase().includes(filter) ||
        (h.role || "").toLowerCase().includes(filter)
      );
    })
    .forEach((h) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-header";

      const name = document.createElement("h4");
      name.className = "ability-name";
      name.textContent = h.name;

      const pill = document.createElement("span");
      pill.className = "power-pill";
      pill.textContent = `${h.type} • ${h.spu || 0} SPU`;

      header.append(name, pill);

      const meta = document.createElement("div");
      meta.className = "ability-meta-row";
      meta.innerHTML = `
        <span><strong>HP:</strong> ${h.hp || 0}</span>
        <span><strong>AC:</strong> ${h.ac || 0}</span>
        <span><strong>Move:</strong> ${h.move || 0}</span>
      `;

      const linkedSoul = state.souls.find((s) => s.id === h.linkedSoulId)?.name || "—";
      const body = document.createElement("p");
      body.className = "ability-paragraph";
      body.innerHTML = `
        <strong>Role:</strong> ${h.role || "—"}<br>
        <strong>Attack:</strong> ${h.attack || "—"}<br>
        <strong>Personality:</strong> ${h.personality || "—"}<br>
        <strong>Location:</strong> ${h.location || "—"}<br>
        <strong>Linked Soul:</strong> ${linkedSoul}
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-button-row";

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn danger";
      btnDelete.textContent = "Delete";
      btnDelete.onclick = () => deleteHomie(h.id);

      btnRow.appendChild(btnDelete);

      card.append(header, meta, body, btnRow);
      container.appendChild(card);
    });
}

// ========= domains & lairs =========
function populateDomainSelects() {
  const homieDomainSelect = document.getElementById("homie-domain");
  const domainHomiesSelect = document.getElementById("domain-homies");
  const lairDomainSelect = document.getElementById("lair-domain-select");

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

function createDomain() {
  const name = document.getElementById("domain-name").value.trim();
  if (!name) {
    showError("Give the Domain a name.");
    return;
  }

  const tier = Number(document.getElementById("domain-tier").value || 0);
  const spu = Number(document.getElementById("domain-spu").value || 0);
  const dc = Number(document.getElementById("domain-dc").value || 0);
  const range = document.getElementById("domain-range").value.trim();
  const personality = document.getElementById("domain-personality").value.trim();
  const lairs = document.getElementById("domain-lairs").value.trim();
  const notes = document.getElementById("domain-notes").value.trim();
  const homieIds = Array.from(
    document.getElementById("domain-homies").selectedOptions || []
  ).map((o) => o.value);

  const domain = {
    id: generateId("domain"),
    name,
    tier,
    spu,
    dc,
    range,
    personality,
    lairs,
    notes,
    homieIds,
  };

  state.domains.push(domain);
  saveState();
  renderDomains();
  populateDomainSelects();
  populateAbilityAssignSelect();
  renderPlayable();
  recalcSpuTotals();
}

function deleteDomain(id) {
  state.domains = state.domains.filter((d) => d.id !== id);
  saveState();
  renderDomains();
  populateDomainSelects();
  populateAbilityAssignSelect();
  renderPlayable();
  recalcSpuTotals();
}

function renderDomains() {
  const container = document.getElementById("domain-list");
  const filter = (document.getElementById("domain-filter").value || "").toLowerCase();
  container.innerHTML = "";

  state.domains
    .filter((d) => {
      if (!filter) return true;
      return d.name.toLowerCase().includes(filter);
    })
    .forEach((d) => {
      const card = document.createElement("div");
      card.className = "ability-card";

      const header = document.createElement("div");
      header.className = "ability-header";

      const name = document.createElement("h4");
      name.className = "ability-name";
      name.textContent = d.name;

      const pill = document.createElement("span");
      pill.className = "power-pill";
      pill.textContent = `Tier ${d.tier} • ${d.spu} SPU • Fear DC ${d.dc}`;

      header.append(name, pill);

      const meta = document.createElement("div");
      meta.className = "ability-meta-row";
      meta.innerHTML = `
        <span><strong>Control Radius:</strong> ${d.range || "—"}</span>
      `;

      const homieNames = d.homieIds
        .map((id) => state.homies.find((h) => h.id === id)?.name || "")
        .filter(Boolean)
        .join(", ") || "—";

      const p = document.createElement("p");
      p.className = "ability-paragraph";
      p.innerHTML = `
        <strong>Personality:</strong> ${d.personality || "—"}<br>
        <strong>Territory Homies:</strong> ${homieNames}<br>
        <strong>Lair Notes:</strong> ${d.lairs || "—"}<br>
        <strong>Notes:</strong> ${d.notes || "—"}
      `;

      const btnRow = document.createElement("div");
      btnRow.className = "ability-button-row";

      const btnDel = document.createElement("button");
      btnDel.className = "btn danger";
      btnDel.textContent = "Delete";
      btnDel.onclick = () => deleteDomain(d.id);

      btnRow.appendChild(btnDel);

      card.append(header, meta, p, btnRow);
      container.appendChild(card);
    });
}

// ========= abilities (manual + AI) =========
function collectCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function populateAbilityAssignSelect() {
  const select = document.getElementById("ability-assigned-to");
  if (!select) return;

  select.innerHTML = "";
  const genOpt = document.createElement("option");
  genOpt.value = "general";
  genOpt.textContent = "General / Party";
  select.appendChild(genOpt);

  const homieGroup = document.createElement("optgroup");
  homieGroup.label = "Homies";
  state.homies.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.name;
    homieGroup.appendChild(opt);
  });
  select.appendChild(homieGroup);

  const domainGroup = document.createElement("optgroup");
  domainGroup.label = "Domains";
  state.domains.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    domainGroup.appendChild(opt);
  });
  select.appendChild(domainGroup);
}

function buildAbilityFromForm(source) {
  const name =
    document.getElementById("ability-name").value.trim() || "Unnamed Ability";
  const assignedTo = document.getElementById("ability-assigned-to").value || "general";
  return {
    id: generateId("ability"),
    name,
    assignedTo,
    action: document.getElementById("ability-action").value.trim(),
    range: document.getElementById("ability-range").value.trim(),
    target: document.getElementById("ability-target").value.trim(),
    dc: document.getElementById("ability-dc").value.trim(),
    damage: document.getElementById("ability-damage").value.trim(),
    power: Number(document.getElementById("ability-power").value || 0),
    soulCost: Number(document.getElementById("ability-soul-cost").value || 0),
    effectTypes: collectCheckedValues(".ability-type"),
    effectNotes: document.getElementById("ability-effect-notes").value.trim(),
    mechanical: document.getElementById("ability-mechanical").value.trim(),
    combo: document.getElementById("ability-combo").value.trim(),
    source,
  };
}

function createAbilityManual() {
  const ability = buildAbilityFromForm("Manual");
  state.abilities.push(ability);
  saveState();
  renderAbilities();
  renderPlayable();
}

async function createAbilityAI() {
  const base = buildAbilityFromForm("AI");

  const payload = {
    mode: "genericAbility",
    name: base.name,
    action: base.action,
    range: base.range,
    target: base.target,
    dc: base.dc,
    damage: base.damage,
    power: base.power,
    soulCost: base.soulCost,
    types: base.effectTypes,
    flavor: base.effectNotes,
    mech: base.mechanical,
    combo: base.combo,
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
      showError("AI ability request failed. Check Vercel logs.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.text) {
      showError("AI did not return a usable ability.");
      return;
    }

    base.mechanical = data.text;
    state.abilities.push(base);
    saveState();
    renderAbilities();
    renderPlayable();
    showError("AI ability generated ✓");
  } catch (e) {
    showError("Error talking to AI endpoint.", e);
  }
}

function deleteAbility(id) {
  state.abilities = state.abilities.filter((a) => a.id !== id);
  saveState();
  renderAbilities();
  renderPlayable();
}

function rerollAbilityToForm(id) {
  const ability = state.abilities.find((a) => a.id === id);
  if (!ability) return;
  document.getElementById("ability-name").value = ability.name;
  document.getElementById("ability-action").value = ability.action;
  document.getElementById("ability-range").value = ability.range;
  document.getElementById("ability-target").value = ability.target;
  document.getElementById("ability-dc").value = ability.dc;
  document.getElementById("ability-damage").value = ability.damage;
  document.getElementById("ability-power").value = ability.power;
  document.getElementById("ability-soul-cost").value = ability.soulCost;
  document.getElementById("ability-effect-notes").value = ability.effectNotes;
  document.getElementById("ability-mechanical").value = ability.mechanical;
  document.getElementById("ability-combo").value = ability.combo;
}

function renderAbilityCard(ability) {
  const card = document.createElement("div");
  card.className = "ability-card";

  const header = document.createElement("div");
  header.className = "ability-header";

  const title = document.createElement("h4");
  title.className = "ability-name";
  title.textContent = ability.name;

  const pill = document.createElement("span");
  pill.className = "power-pill";
  pill.textContent = `Pwr ${ability.power || 0}`;

  header.append(title, pill);

  const meta1 = document.createElement("div");
  meta1.className = "ability-meta-row";
  meta1.innerHTML = `
    <span><strong>Action:</strong> ${ability.action || "—"}</span>
    <span><strong>Range:</strong> ${ability.range || "—"}</span>
    <span><strong>Target:</strong> ${ability.target || "—"}</span>
  `;

  const meta2 = document.createElement("div");
  meta2.className = "ability-meta-row";
  meta2.innerHTML = `
    <span><strong>Save / DC:</strong> ${ability.dc || "—"}</span>
    <span><strong>Damage:</strong> ${ability.damage || "—"}</span>
    <span><strong>Assigned To:</strong> ${resolveAssignedName(ability.assignedTo)}</span>
  `;

  const flavor = document.createElement("p");
  flavor.className = "ability-paragraph";
  if (ability.effectNotes) {
    flavor.innerHTML = ability.effectNotes;
  }

  const mech = document.createElement("p");
  mech.className = "ability-paragraph";
  mech.innerHTML = ability.mechanical || "";

  const combo = document.createElement("p");
  combo.className = "ability-paragraph";
  combo.innerHTML = `<strong>Combo:</strong> ${ability.combo || "—"}`;

  const btnRow = document.createElement("div");
  btnRow.className = "ability-button-row";

  const btnCopy = document.createElement("button");
  btnCopy.className = "btn secondary";
  btnCopy.textContent = "Copy";
  btnCopy.onclick = () => {
    const text = `${ability.name}
Action: ${ability.action}
Range: ${ability.range}
Target: ${ability.target}
Save / DC: ${ability.dc}
Damage: ${ability.damage}

${ability.effectNotes || ""}

${ability.mechanical || ""}

Combo: ${ability.combo || ""}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const btnDel = document.createElement("button");
  btnDel.className = "btn danger";
  btnDel.textContent = "Delete";
  btnDel.onclick = () => deleteAbility(ability.id);

  const btnReroll = document.createElement("button");
  btnReroll.className = "btn primary";
  btnReroll.textContent = "Reroll";
  btnReroll.onclick = () => rerollAbilityToForm(ability.id);

  btnRow.append(btnCopy, btnDel, btnReroll);

  card.append(header, meta1, meta2, flavor, mech, combo, btnRow);
  return card;
}

function resolveAssignedName(id) {
  if (id === "general") return "General";
  const h = state.homies.find((x) => x.id === id);
  if (h) return `Homie: ${h.name}`;
  const d = state.domains.find((x) => x.id === id);
  if (d) return `Domain: ${d.name}`;
  return "—";
}

function renderAbilities() {
  const container = document.getElementById("ability-list");
  const filter = (document.getElementById("ability-filter").value || "").toLowerCase();
  container.innerHTML = "";

  state.abilities
    .filter((a) => {
      if (!filter) return true;
      return a.name.toLowerCase().includes(filter);
    })
    .forEach((a) => {
      container.appendChild(renderAbilityCard(a));
    });
}

// ========= AI lair actions (same card look) =========
let lastLairPayload = null;

function renderLairCards(lairs) {
  const container = document.getElementById("lair-action-cards");
  container.innerHTML = "";
  lairs.forEach((lair) => {
    const card = document.createElement("div");
    card.className = "ability-card";

    const header = document.createElement("div");
    header.className = "ability-header";

    const name = document.createElement("h4");
    name.className = "ability-name";
    name.textContent = lair.name || "Lair Action";

    const pill = document.createElement("span");
    pill.className = "power-pill";
    pill.textContent = `Pwr ${lair.power || 0}`;

    header.append(name, pill);

    const meta = document.createElement("div");
    meta.className = "ability-meta-row";
    meta.innerHTML = `<span><strong>Domain:</strong> ${lair.domainName || "—"}</span>`;

    const body = document.createElement("p");
    body.className = "ability-paragraph";
    body.innerHTML = lair.text || "";

    const btnRow = document.createElement("div");
    btnRow.className = "ability-button-row";

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn secondary";
    btnCopy.textContent = "Copy";
    btnCopy.onclick = () =>
      navigator.clipboard?.writeText(`${lair.name}\n\n${lair.text || ""}`);

    btnRow.appendChild(btnCopy);

    card.append(header, meta, body, btnRow);
    container.appendChild(card);
  });
}

async function generateLairs() {
  const domainId = document.getElementById("lair-domain-select").value;
  const domain = state.domains.find((d) => d.id === domainId);
  if (!domain) {
    showError("Select a domain for lair actions.");
    return;
  }

  const power = Number(document.getElementById("lair-power").value || 7);
  const count = Math.min(
    5,
    Math.max(1, Number(document.getElementById("lair-count").value || 1))
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
      showError("AI lair action request failed.");
      return;
    }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.lairs)) {
      showError("AI did not return lair actions.");
      return;
    }
    // attach domain name for display
    data.lairs.forEach((l) => (l.domainName = domain.name));
    renderLairCards(data.lairs);
  } catch (e) {
    showError("Error talking to AI for lair actions.", e);
  }
}

async function rerollLairs() {
  if (!lastLairPayload) {
    showError("No lair actions to reroll yet.");
    return;
  }
  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastLairPayload),
    });
    if (!res.ok) {
      showError("AI lair action request failed.");
      return;
    }
    const data = await res.json();
    if (!data.success || !Array.isArray(data.lairs)) {
      showError("AI did not return lair actions.");
      return;
    }
    data.lairs.forEach(
      (l) => (l.domainName = lastLairPayload.domain.name)
    );
    renderLairCards(data.lairs);
  } catch (e) {
    showError("Error rerolling lair actions.", e);
  }
}

// ========= playable dashboard =========
function renderPlayable() {
  const homiesContainer = document.getElementById("playable-homies");
  const domainsContainer = document.getElementById("playable-domains");
  homiesContainer.innerHTML = "";
  domainsContainer.innerHTML = "";

  // homies
  state.homies.forEach((h) => {
    const item = document.createElement("div");
    item.className = "playable-item";

    const header = document.createElement("div");
    header.className = "playable-header";

    const title = document.createElement("div");
    title.className = "playable-title";
    title.textContent = `${h.name} (HP ${h.hp || 0}, AC ${h.ac || 0})`;

    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = "Details";

    const body = document.createElement("div");
    body.className = "playable-body";

    const abilities = state.abilities.filter((a) => a.assignedTo === h.id);

    const summary = document.createElement("p");
    summary.className = "ability-paragraph";
    summary.innerHTML = `
      <strong>Role:</strong> ${h.role || "—"}<br>
      <strong>Attack:</strong> ${h.attack || "—"}<br>
      <strong>Personality:</strong> ${h.personality || "—"}<br>
      <strong>Location:</strong> ${h.location || "—"}
    `;

    body.appendChild(summary);

    if (abilities.length) {
      const label = document.createElement("p");
      label.className = "ability-paragraph";
      label.innerHTML = "<strong>Abilities:</strong>";
      body.appendChild(label);
      abilities.forEach((a) => body.appendChild(renderAbilityCard(a)));
    } else {
      const label = document.createElement("p");
      label.className = "ability-paragraph";
      label.innerHTML = "<em>No assigned abilities yet.</em>";
      body.appendChild(label);
    }

    btn.onclick = () => {
      body.classList.toggle("open");
    };

    header.append(title, btn);
    item.append(header, body);
    homiesContainer.appendChild(item);
  });

  // domains
  state.domains.forEach((d) => {
    const item = document.createElement("div");
    item.className = "playable-item";

    const header = document.createElement("div");
    header.className = "playable-header";

    const title = document.createElement("div");
    title.className = "playable-title";
    title.textContent = `${d.name} (Tier ${d.tier}, Fear DC ${d.dc || 0})`;

    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = "Details";

    const body = document.createElement("div");
    body.className = "playable-body";

    const summary = document.createElement("p");
    summary.className = "ability-paragraph";
    summary.innerHTML = `
      <strong>Control Radius:</strong> ${d.range || "—"}<br>
      <strong>Personality:</strong> ${d.personality || "—"}<br>
      <strong>Lair Notes:</strong> ${d.lairs || "—"}
    `;

    body.appendChild(summary);

    const abilities = state.abilities.filter((a) => a.assignedTo === d.id);
    if (abilities.length) {
      const label = document.createElement("p");
      label.className = "ability-paragraph";
      label.innerHTML = "<strong>Domain Abilities:</strong>";
      body.appendChild(label);
      abilities.forEach((a) => body.appendChild(renderAbilityCard(a)));
    }

    btn.onclick = () => body.classList.toggle("open");

    header.append(title, btn);
    item.append(header, body);
    domainsContainer.appendChild(item);
  });
}

// ========= save / reset / print =========
function handleManualSave() {
  saveState();
  showError("Saved locally ✓");
}

function handleReset() {
  if (!confirm("Clear ALL souls, homies, domains, and abilities?")) return;
  state.souls = [];
  state.homies = [];
  state.domains = [];
  state.abilities = [];
  saveState();
  renderSoulBank();
  renderHomies();
  renderDomains();
  renderAbilities();
  renderPlayable();
  populateSoulSelects();
  populateDomainSelects();
  populateAbilityAssignSelect();
  recalcSpuTotals();
}

function handlePrint() {
  window.print();
}

// ========= tab system =========
function initTabs() {
  const buttons = document.querySelectorAll(".nav-item");
  const sections = {
    souls: document.getElementById("tab-souls"),
    homies: document.getElementById("tab-homies"),
    abilities: document.getElementById("tab-abilities"),
    domains: document.getElementById("tab-domains"),
    playable: document.getElementById("tab-playable"),
  };

  function activateTab(name) {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    Object.entries(sections).forEach(([key, section]) => {
      section.classList.toggle("active", key === name);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      activateTab(tab);
    });
  });

  // default home = souls
  activateTab("souls");
}

// ========= init =========
function init() {
  loadState();

  // soul panel
  document.getElementById("btn-recalc-soul")?.addEventListener("click", calcSoulFromInputs);
  document.getElementById("btn-add-soul")?.addEventListener("click", addSoulToBank);
  document.getElementById("soul-filter")?.addEventListener("input", renderSoulBank);

  // homies
  document.getElementById("btn-create-homie")?.addEventListener("click", createHomie);
  document.getElementById("homie-filter")?.addEventListener("input", renderHomies);

  // domains
  document.getElementById("btn-create-domain")?.addEventListener("click", createDomain);
  document.getElementById("domain-filter")?.addEventListener("input", renderDomains);
  document.getElementById("btn-generate-lairs")?.addEventListener("click", generateLairs);
  document.getElementById("btn-reroll-lairs")?.addEventListener("click", rerollLairs);

  // abilities
  document
    .getElementById("btn-create-ability-manual")
    ?.addEventListener("click", createAbilityManual);
  document
    .getElementById("btn-create-ability-ai")
    ?.addEventListener("click", createAbilityAI);
  document
    .getElementById("ability-filter")
    ?.addEventListener("input", renderAbilities);

  // global buttons
  document.getElementById("btn-save")?.addEventListener("click", handleManualSave);
  document.getElementById("btn-reset")?.addEventListener("click", handleReset);
  document.getElementById("btn-print")?.addEventListener("click", handlePrint);

  // render everything
  calcSoulFromInputs();
  renderSoulBank();
  renderHomies();
  renderDomains();
  renderAbilities();
  renderPlayable();
  populateSoulSelects();
  populateDomainSelects();
  populateAbilityAssignSelect();
  recalcSpuTotals();
  initTabs();
}

document.addEventListener("DOMContentLoaded", init);

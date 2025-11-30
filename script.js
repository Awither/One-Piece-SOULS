// ====== GLOBAL ERROR / STATUS BANNER ======
const appErrorBanner = document.getElementById("app-error-banner");
const appErrorText = document.getElementById("app-error-text");
const appErrorClose = document.getElementById("app-error-close");

function showMessage(message, isError = false) {
  if (!appErrorBanner) return;
  appErrorText.textContent = message;
  appErrorBanner.style.background = isError
    ? "rgba(255,79,130,0.96)"
    : "rgba(62,224,255,0.96)";
  appErrorBanner.classList.remove("hidden");
  setTimeout(() => appErrorBanner.classList.add("hidden"), 4500);
}

if (appErrorClose) {
  appErrorClose.addEventListener("click", () => {
    appErrorBanner.classList.add("hidden");
  });
}

// ====== AUTO-EXPAND TEXTAREAS ======
function autoExpand(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + 2}px`;
}

document.querySelectorAll("textarea").forEach((t) => {
  autoExpand(t);
  t.addEventListener("input", () => autoExpand(t));
});

// ====== GLOBAL STATE & LOCALSTORAGE ======
let Souls = [];
let Homies = [];
let Domains = [];
let Abilities = [];

const STORAGE_KEYS = {
  souls: "Souls",
  homies: "Homies",
  domains: "Domains",
  abilities: "Abilities",
};

function uuid() {
  return "_" + Math.random().toString(16).slice(2, 10);
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.souls, JSON.stringify(Souls));
  localStorage.setItem(STORAGE_KEYS.homies, JSON.stringify(Homies));
  localStorage.setItem(STORAGE_KEYS.domains, JSON.stringify(Domains));
  localStorage.setItem(STORAGE_KEYS.abilities, JSON.stringify(Abilities));
  recalcSPUOverview();
}

function loadAll() {
  try {
    const soulsRaw = localStorage.getItem(STORAGE_KEYS.souls);
    const homiesRaw = localStorage.getItem(STORAGE_KEYS.homies);
    const domainsRaw = localStorage.getItem(STORAGE_KEYS.domains);
    const abilitiesRaw = localStorage.getItem(STORAGE_KEYS.abilities);

    Souls = soulsRaw ? JSON.parse(soulsRaw) : [];
    Homies = homiesRaw ? JSON.parse(homiesRaw) : [];
    Domains = domainsRaw ? JSON.parse(domainsRaw) : [];
    Abilities = abilitiesRaw ? JSON.parse(abilitiesRaw) : [];
  } catch (e) {
    console.error("Failed to load from localStorage", e);
    Souls = [];
    Homies = [];
    Domains = [];
    Abilities = [];
  }
}

// ====== SPU OVERVIEW ======
const spuTotalEl = document.getElementById("spu-total");
const spuSpentEl = document.getElementById("spu-spent");
const spuAvailableEl = document.getElementById("spu-available");

function recalcSPUOverview() {
  const totalSPU = Souls.reduce((sum, s) => sum + (s.spu || 0), 0);
  const homieSPU = Homies.reduce((sum, h) => sum + (h.spu || 0), 0);
  const domainSPU = Domains.reduce((sum, d) => sum + (d.spu || 0), 0);
  const spent = homieSPU + domainSPU;
  const available = totalSPU - spent;

  if (spuTotalEl) spuTotalEl.textContent = totalSPU;
  if (spuSpentEl) spuSpentEl.textContent = spent;
  if (spuAvailableEl) spuAvailableEl.textContent = available;
}

// ====== PANEL 1 – SOULS ======
const soulName = document.getElementById("soul-name");
const soulMight = document.getElementById("soul-might");
const soulTier = document.getElementById("soul-tier");
const soulWill = document.getElementById("soul-will");
const soulTags = document.getElementById("soul-tags");
const soulNotes = document.getElementById("soul-notes");
const soulRating = document.getElementById("soul-rating");
const soulLevel = document.getElementById("soul-level");
const soulSpu = document.getElementById("soul-spu");
const soulHp = document.getElementById("soul-hp");
const soulFilter = document.getElementById("soul-filter");
const soulBankList = document.getElementById("soul-bank-list");
const btnRecalcSoul = document.getElementById("btn-recalc-soul");
const btnAddSoul = document.getElementById("btn-add-soul");

function calculateSoul() {
  const might = parseInt(soulMight?.value || "0", 10) || 0;
  const tier = parseInt(soulTier?.value || "0", 10) || 0;
  const will = parseInt(soulWill?.value || "0", 10) || 0;

  const combined = might * 2 + tier * 3 + will * 5;
  const level = Math.max(1, Math.floor(combined / 10));
  const spu = Math.floor(combined * 8.5);
  const hpLost = Math.floor(level * 2);

  if (soulRating) soulRating.textContent = combined;
  if (soulLevel) soulLevel.textContent = level;
  if (soulSpu) soulSpu.textContent = spu;
  if (soulHp) soulHp.textContent = hpLost;

  return { combined, level, spu, hpLost };
}

function renderSoulBank() {
  if (!soulBankList) return;
  soulBankList.innerHTML = "";
  const filterVal = (soulFilter?.value || "").toLowerCase();

  Souls.forEach((soul) => {
    if (
      filterVal &&
      !(
        soul.name.toLowerCase().includes(filterVal) ||
        (soul.tags || "").toLowerCase().includes(filterVal)
      )
    ) {
      return;
    }

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = soul.name || "Unnamed Soul";

    const badges = document.createElement("div");
    badges.className = "card-meta";
    badges.innerHTML = `
      <span class="badge badge-pink">SoL ${soul.level}</span>
      <span class="badge badge-accent">${soul.spu} SPU</span>
      <span class="badge">HP Lost ${soul.hp}</span>
    `;

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <p><strong>Rating:</strong> ${soul.rating}</p>
      <p><strong>Might/Tier/Will:</strong> ${soul.might}/${soul.tier}/${soul.will}</p>
      ${
        soul.tags
          ? `<p><strong>Traits:</strong> ${soul.tags}</p>`
          : ""
      }
      ${
        soul.notes
          ? `<p><strong>Notes:</strong> ${soul.notes}</p>`
          : ""
      }
    `;

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      Souls = Souls.filter((s) => s.id !== soul.id);
      saveAll();
      refreshLinkedSoulDropdown();
      renderSoulBank();
      renderDashboard();
      showMessage("Soul deleted.");
    });
    footer.appendChild(delBtn);

    header.appendChild(title);
    card.appendChild(header);
    card.appendChild(badges);
    card.appendChild(body);
    card.appendChild(footer);
    soulBankList.appendChild(card);
  });
}

if (btnRecalcSoul) {
  btnRecalcSoul.addEventListener("click", () => {
    calculateSoul();
    showMessage("Soul rating recalculated.");
  });
}

if (btnAddSoul) {
  btnAddSoul.addEventListener("click", () => {
    const name = soulName?.value.trim() || "Unnamed Soul";
    const { combined, level, spu, hpLost } = calculateSoul();
    const newSoul = {
      id: uuid(),
      name,
      might: parseInt(soulMight.value || "0", 10) || 0,
      tier: parseInt(soulTier.value || "0", 10) || 0,
      will: parseInt(soulWill.value || "0", 10) || 0,
      rating: combined,
      level,
      spu,
      hp: hpLost,
      tags: soulTags?.value || "",
      notes: soulNotes?.value || "",
    };
    Souls.push(newSoul);
    saveAll();
    renderSoulBank();
    refreshLinkedSoulDropdown();
    renderDashboard();
    showMessage("Soul added to bank ✓");
  });
}

if (soulFilter) {
  soulFilter.addEventListener("input", renderSoulBank);
}

// ====== PANEL 2 – HOMIES ======
const homieName = document.getElementById("homie-name");
const homieType = document.getElementById("homie-type");
const homieLinkedSoul = document.getElementById("homie-linked-soul");
const homieSpu = document.getElementById("homie-spu");
const homieRole = document.getElementById("homie-role");
const homieHp = document.getElementById("homie-hp");
const homieAc = document.getElementById("homie-ac");
const homieMove = document.getElementById("homie-move");
const homieAttack = document.getElementById("homie-attack");
const homiePersonality = document.getElementById("homie-personality");
const homieLocation = document.getElementById("homie-location");
const homieDomain = document.getElementById("homie-domain");
const btnCreateHomie = document.getElementById("btn-create-homie");
const homieFilter = document.getElementById("homie-filter");
const homieRoster = document.getElementById("homie-roster");

function refreshLinkedSoulDropdown() {
  if (!homieLinkedSoul) return;
  const value = homieLinkedSoul.value;
  homieLinkedSoul.innerHTML = `<option value="">— None —</option>`;
  Souls.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.spu} SPU)`;
    homieLinkedSoul.appendChild(opt);
  });
  if (value) homieLinkedSoul.value = value;
}

function refreshDomainDropdownOnHomie() {
  if (!homieDomain) return;
  const val = homieDomain.value;
  homieDomain.innerHTML = `<option value="">— None yet —</option>`;
  Domains.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name} (Tier ${d.tier})`;
    homieDomain.appendChild(opt);
  });
  if (val) homieDomain.value = val;
}

function renderHomies() {
  if (!homieRoster) return;
  homieRoster.innerHTML = "";
  const filterVal = (homieFilter?.value || "").toLowerCase();

  Homies.forEach((h) => {
    if (filterVal && !h.name.toLowerCase().includes(filterVal)) return;

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = h.name || "Unnamed Homie";

    const tagline = document.createElement("div");
    tagline.className = "card-tagline";
    tagline.textContent = `${h.type || "Homie"} • ${h.role || "Role unknown"}`;

    header.appendChild(title);
    header.appendChild(tagline);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <span class="badge badge-pink">${h.spu || 0} SPU</span>
      <span class="badge">HP ${h.hp || 0}</span>
      <span class="badge">AC ${h.ac || 0}</span>
      <span class="badge">Move ${h.move || 0}</span>
    `;

    const body = document.createElement("div");
    body.className = "card-body";
    const linkedSoul = Souls.find((s) => s.id === h.linkedSoulId);
    const domain = Domains.find((d) => d.id === h.domainId);
    body.innerHTML = `
      <p><strong>Attack:</strong> ${h.attack || "—"}</p>
      ${
        linkedSoul
          ? `<p><strong>Linked Soul:</strong> ${linkedSoul.name} (${linkedSoul.spu} SPU)</p>`
          : ""
      }
      ${
        h.personality
          ? `<p><strong>Personality:</strong> ${h.personality}</p>`
          : ""
      }
      ${
        h.location
          ? `<p><strong>Location:</strong> ${h.location}</p>`
          : ""
      }
      ${
        domain
          ? `<p><strong>Assigned Domain:</strong> ${domain.name}</p>`
          : ""
      }
    `;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      Homies = Homies.filter((x) => x.id !== h.id);
      // remove from any domain homie lists
      Domains.forEach((d) => {
        d.homies = (d.homies || []).filter((hid) => hid !== h.id);
      });
      saveAll();
      renderHomies();
      refreshDomainHomiesSelect();
      refreshAbilityAssignDropdown();
      renderDomains();
      renderDashboard();
      showMessage("Homie deleted.");
    });

    footer.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(body);
    card.appendChild(footer);
    homieRoster.appendChild(card);
  });
}

if (btnCreateHomie) {
  btnCreateHomie.addEventListener("click", () => {
    const name = homieName?.value.trim();
    if (!name) {
      showMessage("Homie needs a name.", true);
      return;
    }

    const newHomie = {
      id: uuid(),
      name,
      type: homieType?.value || "Homie",
      linkedSoulId: homieLinkedSoul?.value || "",
      spu: parseInt(homieSpu?.value || "0", 10) || 0,
      role: homieRole?.value || "",
      hp: parseInt(homieHp?.value || "0", 10) || 0,
      ac: parseInt(homieAc?.value || "0", 10) || 0,
      move: parseInt(homieMove?.value || "0", 10) || 0,
      attack: homieAttack?.value || "",
      personality: homiePersonality?.value || "",
      location: homieLocation?.value || "",
      domainId: homieDomain?.value || "",
    };

    Homies.push(newHomie);
    saveAll();
    renderHomies();
    refreshDomainHomiesSelect();
    refreshAbilityAssignDropdown();
    renderDomains();
    renderDashboard();
    showMessage("Homie created ✓");
  });
}

if (homieFilter) {
  homieFilter.addEventListener("input", renderHomies);
}

// ====== PANEL 3 – ABILITIES ======
const abilityName = document.getElementById("ability-name");
const abilityAssign = document.getElementById("ability-assign");
const abilityAction = document.getElementById("ability-action");
const abilityRange = document.getElementById("ability-range");
const abilityTarget = document.getElementById("ability-target");
const abilityDc = document.getElementById("ability-dc");
const abilityDamage = document.getElementById("ability-damage");
const abilityPower = document.getElementById("ability-power");
const abilitySoulCost = document.getElementById("ability-soulcost");
const abilityOutcomeNotes = document.getElementById("ability-outcome-notes");
const abilityMechanical = document.getElementById("ability-mechanical");
const abilityCombo = document.getElementById("ability-combo");
const abilityFilter = document.getElementById("ability-filter");
const abilityList = document.getElementById("ability-list");
const btnAbilityManual = document.getElementById("btn-ability-manual");
const btnAbilityAI = document.getElementById("btn-ability-ai");

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((el) => el.checked)
    .map((el) => el.value);
}

function refreshAbilityAssignDropdown() {
  if (!abilityAssign) return;
  const current = abilityAssign.value || "general";
  abilityAssign.innerHTML = `<option value="general">General / Party</option>`;

  if (Homies.length) {
    const groupLabel = document.createElement("option");
    groupLabel.disabled = true;
    groupLabel.textContent = "— Homies —";
    groupLabel.value = "";
    abilityAssign.appendChild(groupLabel);
    Homies.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = `homie:${h.id}`;
      opt.textContent = `Homie – ${h.name}`;
      abilityAssign.appendChild(opt);
    });
  }

  if (Domains.length) {
    const groupLabel2 = document.createElement("option");
    groupLabel2.disabled = true;
    groupLabel2.textContent = "— Domains —";
    groupLabel2.value = "";
    abilityAssign.appendChild(groupLabel2);
    Domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = `domain:${d.id}`;
      opt.textContent = `Domain – ${d.name}`;
      abilityAssign.appendChild(opt);
    });
  }

  abilityAssign.value = current;
}

function createAbilityFromInputs(textFromAI) {
  const ownerKey = abilityAssign?.value || "general";
  let ownerType = "general";
  let ownerId = "";
  if (ownerKey.startsWith("homie:")) {
    ownerType = "homie";
    ownerId = ownerKey.slice(6);
  } else if (ownerKey.startsWith("domain:")) {
    ownerType = "domain";
    ownerId = ownerKey.slice(7);
  }

  return {
    id: uuid(),
    name: abilityName?.value.trim() || "Unnamed Ability",
    ownerType,
    ownerId,
    action: abilityAction?.value || "",
    range: abilityRange?.value || "",
    target: abilityTarget?.value || "",
    save: abilityDc?.value || "",
    damage: abilityDamage?.value || "",
    power: parseInt(abilityPower?.value || "0", 10) || 0,
    soulCost: parseInt(abilitySoulCost?.value || "0", 10) || 0,
    effectNotes: textFromAI || abilityMechanical?.value || "",
    outcomeNotes: abilityOutcomeNotes?.value || "",
    comboNotes: abilityCombo?.value || "",
  };
}

function renderAbilities() {
  if (!abilityList) return;
  abilityList.innerHTML = "";
  const filterVal = (abilityFilter?.value || "").toLowerCase();

  Abilities.forEach((ab) => {
    if (
      filterVal &&
      !(
        ab.name.toLowerCase().includes(filterVal) ||
        (ab.effectNotes || "").toLowerCase().includes(filterVal)
      )
    ) {
      return;
    }

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = ab.name;

    const ownerLabel = (() => {
      if (ab.ownerType === "homie") {
        const h = Homies.find((x) => x.id === ab.ownerId);
        return h ? `Homie: ${h.name}` : "Homie ability";
      }
      if (ab.ownerType === "domain") {
        const d = Domains.find((x) => x.id === ab.ownerId);
        return d ? `Domain: ${d.name}` : "Domain ability";
      }
      return "General / Party";
    })();

    const tagline = document.createElement("div");
    tagline.className = "card-tagline";
    tagline.textContent = ownerLabel;

    header.appendChild(title);
    header.appendChild(tagline);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    if (ab.power)
      meta.innerHTML += `<span class="badge badge-pink">Power ${ab.power}</span>`;
    if (ab.soulCost)
      meta.innerHTML += `<span class="badge badge-accent">${ab.soulCost} SPU</span>`;
    if (ab.action)
      meta.innerHTML += `<span class="badge">${ab.action}</span>`;
    if (ab.range)
      meta.innerHTML += `<span class="badge">Range ${ab.range}</span>`;
    if (ab.target)
      meta.innerHTML += `<span class="badge">Target ${ab.target}</span>`;

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      ${
        ab.damage
          ? `<p><strong>Damage:</strong> ${ab.damage}</p>`
          : ""
      }
      ${
        ab.save
          ? `<p><strong>Save / DC:</strong> ${ab.save}</p>`
          : ""
      }
      ${
        ab.effectNotes
          ? `<p><strong>Effect:</strong> ${ab.effectNotes}</p>`
          : ""
      }
      ${
        ab.outcomeNotes
          ? `<p><strong>Outcome:</strong> ${ab.outcomeNotes}</p>`
          : ""
      }
      ${
        ab.comboNotes
          ? `<p><strong>Combo / Interactions:</strong> ${ab.comboNotes}</p>`
          : ""
      }
    `;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn-secondary";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      const text = `${ab.name}\nAction: ${ab.action}\nRange: ${ab.range}\nTarget: ${ab.target}\nSave/DC: ${ab.save}\nDamage: ${ab.damage}\n\nEffect:\n${ab.effectNotes}\n\nOutcome:\n${ab.outcomeNotes}\n\nCombo:\n${ab.comboNotes}`;
      navigator.clipboard
        .writeText(text)
        .then(() => showMessage("Ability copied to clipboard ✓"))
        .catch(() => showMessage("Unable to copy ability.", true));
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      Abilities = Abilities.filter((x) => x.id !== ab.id);
      saveAll();
      renderAbilities();
      renderDashboard();
      showMessage("Ability deleted.");
    });

    footer.appendChild(copyBtn);
    footer.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(body);
    card.appendChild(footer);
    abilityList.appendChild(card);
  });
}

if (btnAbilityManual) {
  btnAbilityManual.addEventListener("click", () => {
    const ability = createAbilityFromInputs();
    Abilities.push(ability);
    saveAll();
    renderAbilities();
    renderDashboard();
    showMessage("Ability created.");
  });
}

async function callAI(payload) {
  try {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("AI HTTP error", res.status);
      showMessage("AI request failed.", true);
      return null;
    }
    const data = await res.json();
    if (!data.success) {
      console.error("AI error body", data);
      showMessage("AI returned an error.", true);
      return null;
    }
    return data;
  } catch (err) {
    console.error("AI call failed", err);
    showMessage("AI call failed.", true);
    return null;
  }
}

if (btnAbilityAI) {
  btnAbilityAI.addEventListener("click", async () => {
    const concept = abilityOutcomeNotes?.value || abilityMechanical?.value;
    if (!concept) {
      showMessage(
        "Give the AI some idea of the effect or outcome in the notes first.",
        true
      );
      return;
    }

    const payload = {
      mode: "genericAbility",
      name: abilityName?.value || "",
      ownerKey: abilityAssign?.value || "general",
      action: abilityAction?.value || "",
      range: abilityRange?.value || "",
      target: abilityTarget?.value || "",
      dc: abilityDc?.value || "",
      damage: abilityDamage?.value || "",
      power: parseInt(abilityPower?.value || "0", 10) || 0,
      soulCost: parseInt(abilitySoulCost?.value || "0", 10) || 0,
      types: getCheckedValues(".ability-type"),
      outcomes: getCheckedValues(".ability-outcome"),
      effectNotes: concept,
      outcomeNotes: abilityOutcomeNotes?.value || "",
      mechNotes: abilityMechanical?.value || "",
      comboNotes: abilityCombo?.value || "",
      souls: Souls,
      homies: Homies,
      domains: Domains,
    };

    showMessage("Asking the souls to forge an ability...");
    const data = await callAI(payload);
    if (!data) return;

    const ability = createAbilityFromInputs(data.text || "");
    Abilities.push(ability);
    saveAll();
    renderAbilities();
    renderDashboard();
    showMessage("AI forged a new ability ✓");
  });
}

if (abilityFilter) {
  abilityFilter.addEventListener("input", renderAbilities);
}

// ====== PANEL 4 – DOMAINS ======
const domainName = document.getElementById("domain-name");
const domainTier = document.getElementById("domain-tier");
const domainSpu = document.getElementById("domain-spu");
const domainRange = document.getElementById("domain-range");
const domainDc = document.getElementById("domain-dc");
const domainPersonality = document.getElementById("domain-personality");
const domainNotes = document.getElementById("domain-notes");
const domainHomiesSelect = document.getElementById("domain-homies");
const btnCreateDomain = document.getElementById("btn-create-domain");
const domainFilter = document.getElementById("domain-filter");
const domainList = document.getElementById("domain-list");

function refreshDomainHomiesSelect() {
  if (!domainHomiesSelect) return;
  const selected = Array.from(domainHomiesSelect.selectedOptions).map(
    (o) => o.value
  );
  domainHomiesSelect.innerHTML = "";
  Homies.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.name;
    domainHomiesSelect.appendChild(opt);
  });
  selected.forEach((val) => {
    const opt = Array.from(domainHomiesSelect.options).find(
      (o) => o.value === val
    );
    if (opt) opt.selected = true;
  });
}

function renderDomains() {
  if (!domainList) return;
  domainList.innerHTML = "";
  const filterVal = (domainFilter?.value || "").toLowerCase();

  Domains.forEach((d) => {
    if (filterVal && !d.name.toLowerCase().includes(filterVal)) return;
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = d.name;

    const tagline = document.createElement("div");
    tagline.className = "card-tagline";
    tagline.textContent = `Tier ${d.tier}, Fear DC ${d.dc}`;

    header.appendChild(title);
    header.appendChild(tagline);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <span class="badge badge-pink">${d.spu || 0} SPU</span>
      <span class="badge">Control Radius: ${d.range || "—"}</span>
    `;

    const body = document.createElement("div");
    body.className = "card-body";

    body.innerHTML = `
      ${
        d.personality
          ? `<p><strong>Personality:</strong> ${d.personality}</p>`
          : ""
      }
      ${
        d.notes
          ? `<p><strong>Notes:</strong> ${d.notes}</p>`
          : ""
      }
      <p><strong>Territory Homies:</strong> ${
        (d.homies || [])
          .map((id) => {
            const h = Homies.find((x) => x.id === id);
            return h ? h.name : "Unknown Homie";
          })
          .join(", ") || "—"
      }</p>
    `;

    // Lair actions section
    const lairContainer = document.createElement("div");
    lairContainer.className = "lair-actions";

    (d.lairActions || []).forEach((la) => {
      const laCard = document.createElement("div");
      laCard.className = "small-card";
      laCard.innerHTML = `
        <strong>${la.name || "Lair Action"}</strong><br/>
        ${la.dc ? `<em>Save / DC:</em> ${la.dc}<br/>` : ""}
        ${la.effect || ""}
        ${
          la.notes
            ? `<br/><span style="font-size:11px;color:#9c9cd0;"><em>${la.notes}</em></span>`
            : ""
        }
      `;
      lairContainer.appendChild(laCard);
    });

    body.appendChild(lairContainer);

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const genBtn = document.createElement("button");
    genBtn.className = "btn-secondary";
    genBtn.textContent = "Generate Lair Actions (AI)";
    genBtn.addEventListener("click", async () => {
      showMessage(`Asking the land of ${d.name} to reveal new lair actions...`);
      const data = await callAI({
        mode: "domainLair",
        domain: d,
        homies: Homies.filter((h) => (d.homies || []).includes(h.id)),
      });
      if (!data || !Array.isArray(data.actions)) return;
      d.lairActions = data.actions.map((a) => ({
        id: uuid(),
        name: a.name || "Lair Action",
        dc: a.dc || "",
        effect: a.effect || "",
        notes: a.notes || "",
      }));
      saveAll();
      renderDomains();
      renderDashboard();
      showMessage("New lair actions forged ✓");
    });

    const rerollBtn = document.createElement("button");
    rerollBtn.className = "btn-primary";
    rerollBtn.textContent = "Reroll Lair Actions";
    rerollBtn.addEventListener("click", async () => {
      showMessage(`Rerolling lair actions for ${d.name}...`);
      const data = await callAI({
        mode: "domainLair",
        domain: d,
        homies: Homies.filter((h) => (d.homies || []).includes(h.id)),
        reroll: true,
      });
      if (!data || !Array.isArray(data.actions)) return;
      d.lairActions = data.actions.map((a) => ({
        id: uuid(),
        name: a.name || "Lair Action",
        dc: a.dc || "",
        effect: a.effect || "",
        notes: a.notes || "",
      }));
      saveAll();
      renderDomains();
      renderDashboard();
      showMessage("Lair actions rerolled ✓");
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      Domains = Domains.filter((x) => x.id !== d.id);
      // Clear references on homies
      Homies.forEach((h) => {
        if (h.domainId === d.id) h.domainId = "";
      });
      saveAll();
      renderDomains();
      renderDashboard();
      refreshDomainDropdownOnHomie();
      refreshAbilityAssignDropdown();
      showMessage("Domain deleted.");
    });

    footer.appendChild(genBtn);
    footer.appendChild(rerollBtn);
    footer.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(body);
    card.appendChild(footer);
    domainList.appendChild(card);
  });
}

if (btnCreateDomain) {
  btnCreateDomain.addEventListener("click", () => {
    const name = domainName?.value.trim();
    if (!name) {
      showMessage("Domain needs a name.", true);
      return;
    }
    const homieIds = Array.from(domainHomiesSelect?.selectedOptions || []).map(
      (o) => o.value
    );
    const domain = {
      id: uuid(),
      name,
      tier: parseInt(domainTier?.value || "0", 10) || 0,
      spu: parseInt(domainSpu?.value || "0", 10) || 0,
      range: domainRange?.value || "",
      dc: parseInt(domainDc?.value || "0", 10) || 0,
      personality: domainPersonality?.value || "",
      notes: domainNotes?.value || "",
      homies: homieIds,
      lairActions: [],
    };
    Domains.push(domain);
    saveAll();
    renderDomains();
    refreshDomainDropdownOnHomie();
    refreshAbilityAssignDropdown();
    renderDashboard();
    showMessage("Domain created ✓");
  });
}

if (domainFilter) {
  domainFilter.addEventListener("input", renderDomains);
}

// ====== PANEL 5 – DASHBOARD (ACCORDIONS) ======
const dashboardHomies = document.getElementById("dashboard-homies");
const dashboardDomains = document.getElementById("dashboard-domains");

function makeAccordionCard({ title, subtitle, statsHtml, bodyHtml }) {
  const acc = document.createElement("div");
  acc.className = "accordion";

  const header = document.createElement("div");
  header.className = "accordion-header";

  const main = document.createElement("div");
  main.className = "accordion-header-main";

  const t = document.createElement("div");
  t.className = "accordion-title";
  t.textContent = title;

  const st = document.createElement("div");
  st.className = "accordion-subtitle";
  st.textContent = subtitle || "";

  main.appendChild(t);
  if (subtitle) main.appendChild(st);

  const stats = document.createElement("div");
  stats.className = "accordion-stats";
  stats.innerHTML = statsHtml || "";

  const toggle = document.createElement("div");
  toggle.className = "accordion-toggle";
  toggle.textContent = "›";

  header.appendChild(main);
  header.appendChild(stats);
  header.appendChild(toggle);

  const body = document.createElement("div");
  body.className = "accordion-body";
  const inner = document.createElement("div");
  inner.className = "accordion-body-inner";
  inner.innerHTML = bodyHtml || "";
  body.appendChild(inner);

  acc.appendChild(header);
  acc.appendChild(body);

  header.addEventListener("click", () => {
    acc.classList.toggle("open");
  });

  return acc;
}

function renderDashboard() {
  if (dashboardHomies) {
    dashboardHomies.innerHTML = "";
    Homies.forEach((h) => {
      const linkedSoul = Souls.find((s) => s.id === h.linkedSoulId);
      const domain = Domains.find((d) => d.id === h.domainId);

      const abilities = Abilities.filter(
        (ab) => ab.ownerType === "homie" && ab.ownerId === h.id
      );

      let bodyHtml = `
        <div class="detail-section">
          <h4>Core Stats</h4>
          <p><strong>HP:</strong> ${h.hp || 0} • <strong>AC:</strong> ${
        h.ac || 0
      } • <strong>Move:</strong> ${h.move || 0}</p>
          <p><strong>Attack:</strong> ${h.attack || "—"}</p>
          ${
            h.personality
              ? `<p><strong>Personality:</strong> ${h.personality}</p>`
              : ""
          }
          ${
            h.location
              ? `<p><strong>Location:</strong> ${h.location}</p>`
              : ""
          }
          ${
            linkedSoul
              ? `<p><strong>Linked Soul:</strong> ${linkedSoul.name} (${linkedSoul.spu} SPU)</p>`
              : ""
          }
          ${
            domain
              ? `<p><strong>Domain:</strong> ${domain.name}</p>`
              : ""
          }
        </div>
      `;

      bodyHtml += `
        <div class="detail-section">
          <h4>Abilities</h4>
          ${
            abilities.length === 0
              ? "<p>No specific abilities assigned. Use Panel 3 to add some.</p>"
              : ""
          }
      `;
      abilities.forEach((ab) => {
        bodyHtml += `
          <div class="small-card">
            <strong>${ab.name}</strong><br/>
            ${ab.action ? `<em>${ab.action}</em> • ` : ""}${
          ab.range ? `Range ${ab.range}` : ""
        }<br/>
            ${ab.target ? `Target: ${ab.target}<br/>` : ""}
            ${ab.save ? `Save/DC: ${ab.save}<br/>` : ""}
            ${ab.damage ? `Damage: ${ab.damage}<br/>` : ""}
            ${
              ab.effectNotes
                ? `${ab.effectNotes}<br/>`
                : ""
            }
            ${
              ab.comboNotes
                ? `<span style="font-size:11px;color:#9c9cd0;"><em>${ab.comboNotes}</em></span>`
                : ""
            }
          </div>
        `;
      });
      bodyHtml += "</div>";

      const acc = makeAccordionCard({
        title: h.name,
        subtitle: `${h.type || "Homie"} • ${h.role || "Role unknown"}`,
        statsHtml: `
          <span>HP ${h.hp || 0}</span>
          <span>AC ${h.ac || 0}</span>
          <span>Move ${h.move || 0}</span>
          <span>${h.spu || 0} SPU</span>
        `,
        bodyHtml,
      });
      dashboardHomies.appendChild(acc);
    });
  }

  if (dashboardDomains) {
    dashboardDomains.innerHTML = "";
    Domains.forEach((d) => {
      const homies = Homies.filter((h) => (d.homies || []).includes(h.id));
      const abilities = Abilities.filter(
        (ab) => ab.ownerType === "domain" && ab.ownerId === d.id
      );

      let bodyHtml = `
        <div class="detail-section">
          <h4>Domain Stats</h4>
          <p><strong>Tier:</strong> ${d.tier} • <strong>Fear DC:</strong> ${
        d.dc
      } • <strong>SPU:</strong> ${d.spu || 0}</p>
          <p><strong>Control Radius:</strong> ${d.range || "—"}</p>
          ${
            d.personality
              ? `<p><strong>Personality:</strong> ${d.personality}</p>`
              : ""
          }
          ${
            d.notes ? `<p><strong>Notes:</strong> ${d.notes}</p>` : ""
          }
        </div>
        <div class="detail-section">
          <h4>Territory Homies</h4>
          ${
            homies.length === 0
              ? "<p>None assigned.</p>"
              : `<p>${homies.map((h) => h.name).join(", ")}</p>`
          }
        </div>
        <div class="detail-section">
          <h4>Lair Actions</h4>
          ${
            (d.lairActions || []).length === 0
              ? "<p>No lair actions yet. Use Panel 4 to generate some.</p>"
              : ""
          }
      `;

      (d.lairActions || []).forEach((la) => {
        bodyHtml += `
          <div class="small-card">
            <strong>${la.name || "Lair Action"}</strong><br/>
            ${la.dc ? `Save/DC: ${la.dc}<br/>` : ""}
            ${la.effect || ""}
            ${
              la.notes
                ? `<br/><span style="font-size:11px;color:#9c9cd0;"><em>${la.notes}</em></span>`
                : ""
            }
          </div>
        `;
      });
      bodyHtml += "</div>";

      bodyHtml += `
        <div class="detail-section">
          <h4>Domain-Specific Abilities</h4>
          ${
            abilities.length === 0
              ? "<p>No abilities assigned. Use Panel 3 to add some.</p>"
              : ""
          }
      `;
      abilities.forEach((ab) => {
        bodyHtml += `
          <div class="small-card">
            <strong>${ab.name}</strong><br/>
            ${ab.action ? `<em>${ab.action}</em> • ` : ""}${
          ab.range ? `Range ${ab.range}` : ""
        }<br/>
            ${ab.target ? `Target: ${ab.target}<br/>` : ""}
            ${ab.save ? `Save/DC: ${ab.save}<br/>` : ""}
            ${ab.damage ? `Damage: ${ab.damage}<br/>` : ""}
            ${ab.effectNotes || ""}
          </div>
        `;
      });
      bodyHtml += "</div>";

      const acc = makeAccordionCard({
        title: d.name,
        subtitle: `Tier ${d.tier} • Fear DC ${d.dc}`,
        statsHtml: `
          <span>${d.spu || 0} SPU</span>
          <span>${d.range || ""}</span>
        `,
        bodyHtml,
      });

      dashboardDomains.appendChild(acc);
    });
  }
}

// ====== GLOBAL CONTROLS ======
const btnSaveNow = document.getElementById("btn-save-now");
const btnResetAll = document.getElementById("btn-reset-all");
const btnPrintReference = document.getElementById("btn-print-reference");

if (btnSaveNow) {
  btnSaveNow.addEventListener("click", () => {
    saveAll();
    showMessage("State saved to your browser storage ✓");
  });
}

if (btnResetAll) {
  btnResetAll.addEventListener("click", () => {
    if (
      !confirm(
        "This will clear all Souls, Homies, Domains, and Abilities from this browser. Are you sure?"
      )
    )
      return;
    Souls = [];
    Homies = [];
    Domains = [];
    Abilities = [];
    saveAll();
    renderSoulBank();
    renderHomies();
    renderDomains();
    renderAbilities();
    renderDashboard();
    refreshLinkedSoulDropdown();
    refreshDomainDropdownOnHomie();
    refreshDomainHomiesSelect();
    refreshAbilityAssignDropdown();
    showMessage("All data cleared.");
  });
}

if (btnPrintReference) {
  btnPrintReference.addEventListener("click", () => {
    window.print();
  });
}

// ====== INITIALIZE ======
loadAll();
calculateSoul();
recalcSPUOverview();
refreshLinkedSoulDropdown();
refreshDomainDropdownOnHomie();
refreshDomainHomiesSelect();
refreshAbilityAssignDropdown();
renderSoulBank();
renderHomies();
renderDomains();
renderAbilities();
renderDashboard();

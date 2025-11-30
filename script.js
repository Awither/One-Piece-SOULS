/* ============================================================
   Soul-Soul Fruit Control Panel — FULL LOGIC ENGINE
   Wave C — Clean Unified Architecture
=========================================================== */

/* ------------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------------ */
const AppState = {
    souls: [],
    homies: [],
    domains: [],
    abilities: [],
};

/* ------------------------------------------------------------
   STORAGE MANAGER
------------------------------------------------------------ */
const Storage = {
    load() {
        try {
            AppState.souls = JSON.parse(localStorage.getItem("Souls")) || [];
            AppState.homies = JSON.parse(localStorage.getItem("Homies")) || [];
            AppState.domains = JSON.parse(localStorage.getItem("Domains")) || [];
            AppState.abilities = JSON.parse(localStorage.getItem("Abilities")) || [];
        } catch {
            console.warn("Storage load failed.");
        }
    },

    save() {
        localStorage.setItem("Souls", JSON.stringify(AppState.souls));
        localStorage.setItem("Homies", JSON.stringify(AppState.homies));
        localStorage.setItem("Domains", JSON.stringify(AppState.domains));
        localStorage.setItem("Abilities", JSON.stringify(AppState.abilities));
    }
};

/* ------------------------------------------------------------
   ERROR / SUCCESS BANNER
------------------------------------------------------------ */
function showMessage(msg, isError = false) {
    const banner = document.getElementById("app-error-banner");
    const text = document.getElementById("app-error-text");
    text.textContent = msg;

    banner.style.background = isError
        ? "rgba(255,80,80,0.65)"
        : "rgba(80,255,120,0.65)";

    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 5000);
}
document.getElementById("app-error-close").onclick = () =>
    document.getElementById("app-error-banner").classList.add("hidden");

/* ------------------------------------------------------------
   UTILITIES
------------------------------------------------------------ */
const uuid = () => "_" + Math.random().toString(36).slice(2);

/* Expand textareas while typing */
document.addEventListener("input", e => {
    if (e.target.tagName === "TEXTAREA") {
        e.target.style.height = "auto";
        e.target.style.height = (e.target.scrollHeight + 2) + "px";
    }
});

/* Accordion Toggle Handler */
function setupAccordion(headerEl, contentEl, containerEl) {
    headerEl.addEventListener("click", () => {
        containerEl.classList.toggle("open");
    });
}

/* ------------------------------------------------------------
   RENDER ENGINE — ROOT REFRESH
------------------------------------------------------------ */
function rerender() {
    renderSouls();
    renderHomies();
    renderAbilities();
    renderDomains();
    renderPlayableView();
    refreshAbilityAssignTargets();
    Storage.save();
}

/* ------------------------------------------------------------
   PANEL 1 — SOUL RATING + BANK
------------------------------------------------------------ */
function calculateSoul() {
    const name = document.getElementById("soul-name").value.trim();
    const might = +document.getElementById("soul-might").value || 0;
    const tier = +document.getElementById("soul-tier").value || 0;
    const will = +document.getElementById("soul-will").value || 0;

    const combined = (might * 2) + (tier * 3) + (will * 5);
    const level = Math.max(1, Math.floor(combined / 10));
    const spu = Math.floor(combined * 8.5);
    const hp = Math.floor(level * 2);

    document.getElementById("soul-rating").textContent = combined;
    document.getElementById("soul-level").textContent = level;
    document.getElementById("soul-spu").textContent = spu;
    document.getElementById("soul-hp").textContent = hp;

    return { name, might, tier, will, combined, level, spu, hp };
}

document.getElementById("btn-recalc-souls").onclick = () => calculateSoul();

document.getElementById("btn-add-soul").onclick = () => {
    const calc = calculateSoul();
    if (!calc.name) return showMessage("Soul requires a name.", true);

    AppState.souls.push({
        id: uuid(),
        name: calc.name,
        might: calc.might,
        tier: calc.tier,
        will: calc.will,
        rating: calc.combined,
        level: calc.level,
        spu: calc.spu,
        hp: calc.hp,
        tags: document.getElementById("soul-tags").value,
        notes: document.getElementById("soul-notes").value
    });

    showMessage("Soul added ✓");
    rerender();
};

function renderSouls() {
    const list = document.getElementById("soul-bank-list");
    const filter = document.getElementById("soul-filter").value.toLowerCase();
    list.innerHTML = "";

    AppState.souls
        .filter(s => s.name.toLowerCase().includes(filter))
        .forEach(soul => {
            const card = document.createElement("div");
            card.className = "ability-card";
            card.innerHTML = `
                <div class="card-title">${soul.name}</div>
                <p>Rating: ${soul.rating} | Level: ${soul.level} | SPU: ${soul.spu}</p>
                <button class="btn-secondary" data-del="${soul.id}">Delete</button>
            `;
            card.querySelector("button").onclick = () => {
                AppState.souls = AppState.souls.filter(x => x.id !== soul.id);
                rerender();
            };
            list.appendChild(card);
        });
}

/* ------------------------------------------------------------
   PANEL 2 — HOMIES
------------------------------------------------------------ */
document.getElementById("btn-create-homie").onclick = () => {
    const name = document.getElementById("homie-name").value.trim();
    if (!name) return showMessage("Homie must have a name.", true);

    AppState.homies.push({
        id: uuid(),
        name,
        type: document.getElementById("homie-type").value,
        linkedSoul: document.getElementById("homie-linked-soul").value,
        spu: +document.getElementById("homie-spu").value || 0,
        role: document.getElementById("homie-role").value,
        hp: +document.getElementById("homie-hp").value,
        ac: +document.getElementById("homie-ac").value,
        move: +document.getElementById("homie-move").value,
        attack: document.getElementById("homie-attack").value,
        personality: document.getElementById("homie-personality").value,
        location: document.getElementById("homie-location").value,
        abilities: []
    });

    showMessage("Homie created ✓");
    rerender();
};

function renderHomies() {
    const list = document.getElementById("homie-roster");
    const filter = document.getElementById("homie-filter").value.toLowerCase();

    list.innerHTML = "";

    AppState.homies
        .filter(h => h.name.toLowerCase().includes(filter))
        .forEach(h => {
            const card = document.createElement("div");
            card.className = "ability-card";
            card.innerHTML = `
                <div class="card-title">${h.name}</div>
                <p>${h.type}</p>
                <button class="btn-secondary" data-del="${h.id}">Delete</button>
            `;
            card.querySelector("button").onclick = () => {
                AppState.homies = AppState.homies.filter(x => x.id !== h.id);
                rerender();
            };
            list.appendChild(card);
        });

    refreshAbilityAssignTargets();
}

/* ------------------------------------------------------------
   PANEL 3 — ABILITIES
------------------------------------------------------------ */

/* Save new ability (manual) */
document.getElementById("btn-ability-manual").onclick = () => createAbility(false);
/* Generate via AI */
document.getElementById("btn-ability-ai").onclick = () => createAbility(true);

async function createAbility(useAI) {
    const name = document.getElementById("ability-name").value.trim();
    const assign = document.getElementById("ability-assign-target").value;

    const ability = {
        id: uuid(),
        name,
        assign,
        action: document.getElementById("ability-action").value,
        range: document.getElementById("ability-range").value,
        target: document.getElementById("ability-target").value,
        dc: document.getElementById("ability-dc").value,
        dmg: document.getElementById("ability-dmg").value,
        power: document.getElementById("ability-power").value,
        spu: document.getElementById("ability-spu").value,
        effect: document.getElementById("ability-effect").value,
        mech: document.getElementById("ability-mech").value,
        combo: document.getElementById("ability-combo").value,
        type: "ability"
    };

    if (useAI) {
        try {
            const out = await callAI({
                mode: "genericAbility",
                prompt: ability.effect,
                role: "offense",
                power: ability.power,
                souls: AppState.souls,
                homies: AppState.homies,
                domains: AppState.domains
            });
            ability.generated = out;
            ability.effect = out;
        } catch (err) {
            return showMessage("AI failed.", true);
        }
    }

    AppState.abilities.push(ability);
    showMessage("Ability saved ✓");
    rerender();
}

function refreshAbilityAssignTargets() {
    const select = document.getElementById("ability-assign-target");
    select.innerHTML = `<option value="">General / Party</option>`;

    AppState.homies.forEach(h =>
        select.innerHTML += `<option value="homie-${h.id}">Homie — ${h.name}</option>`
    );

    AppState.domains.forEach(d =>
        select.innerHTML += `<option value="domain-${d.id}">Domain — ${d.name}</option>`
    );
}

/* RENDER PANEL 3 LIST */
function renderAbilities() {
    const list = document.getElementById("ability-list");
    const filter = document.getElementById("ability-filter").value.toLowerCase();
    list.innerHTML = "";

    AppState.abilities
        .filter(a => a.name.toLowerCase().includes(filter))
        .forEach(ability => list.appendChild(renderAbilityCard(ability, true)));
}

/* Unified card renderer */
function renderAbilityCard(ability, editable = false) {
    const card = document.createElement("div");
    card.className = "ability-card";

    card.innerHTML = `
        <div class="card-title">${ability.name || "Unnamed Ability"}</div>
        <div class="stats-grid">
            <div class="stats-item"><span>Action</span>${ability.action}</div>
            <div class="stats-item"><span>Range</span>${ability.range}</div>
            <div class="stats-item"><span>Target</span>${ability.target}</div>
            <div class="stats-item"><span>Save/DC</span>${ability.dc}</div>
            <div class="stats-item"><span>Damage</span>${ability.dmg}</div>
            <div class="stats-item"><span>Assign</span>${ability.assign || "General"}</div>
        </div>
        <div class="divider"></div>

        <div class="card-section">
            <label>Effect</label>
            <p>${ability.effect || ""}</p>
        </div>

        <div class="card-section">
            <label>Mechanical</label>
            <p>${ability.mech || ""}</p>
        </div>

        <div class="card-section">
            <label>Combo</label>
            <p>${ability.combo || ""}</p>
        </div>

        ${editable ? `
            <button class="btn" data-save="${ability.id}">Save</button>
            <button class="btn-secondary" data-del="${ability.id}">Delete</button>
        ` : ""}
    `;

    if (editable) {
        card.querySelector(`[data-del="${ability.id}"]`).onclick = () => {
            AppState.abilities = AppState.abilities.filter(x => x.id !== ability.id);
            rerender();
        };
    }

    return card;
}

/* ------------------------------------------------------------
   PANEL 4 — DOMAINS + AI LAIRS
------------------------------------------------------------ */
document.getElementById("btn-create-domain").onclick = () => {
    const domain = {
        id: uuid(),
        name: document.getElementById("domain-name").value.trim(),
        tier: +document.getElementById("domain-tier").value,
        spu: +document.getElementById("domain-spu").value,
        dc: +document.getElementById("domain-dc").value,
        range: document.getElementById("domain-range").value,
        personality: document.getElementById("domain-personality").value,
        lairs: [], // array of lair action objects
    };

    // manual lairs
    const manual = document.getElementById("domain-lairs").value.trim();
    if (manual) domain.lairs.push({
        id: uuid(),
        type: "lair",
        name: "Manual Lair Action",
        effect: manual
    });

    AppState.domains.push(domain);
    showMessage("Domain created ✓");
    rerender();
};

function renderDomains() {
    const list = document.getElementById("domain-list");
    const filter = document.getElementById("domain-filter").value.toLowerCase();

    list.innerHTML = "";

    AppState.domains
        .filter(d => d.name.toLowerCase().includes(filter))
        .forEach(domain => {
            const card = document.createElement("div");
            card.className = "ability-card";
            card.innerHTML = `
                <div class="card-title">${domain.name}</div>
                <p>Tier: ${domain.tier} | SPU: ${domain.spu} | Fear DC: ${domain.dc}</p>
                <button class="btn-secondary" data-del="${domain.id}">Delete</button>
            `;
            card.querySelector("button").onclick = () => {
                AppState.domains = AppState.domains.filter(x => x.id !== domain.id);
                rerender();
            };
            list.appendChild(card);
        });

    refreshAbilityAssignTargets();
    populateDomainAISelect();
}

function populateDomainAISelect() {
    const sel = document.getElementById("ai-domain-target");
    sel.innerHTML = `<option value="">Select Domain</option>`;
    AppState.domains.forEach(d =>
        sel.innerHTML += `<option value="${d.id}">${d.name}</option>`
    );
}

/* AI LAIR GENERATOR */
document.getElementById("btn-generate-domain-ai").onclick = async () => {
    const domainID = document.getElementById("ai-domain-target").value;
    if (!domainID) return showMessage("Select domain first.", true);

    const domain = AppState.domains.find(d => d.id === domainID);
    const concept = document.getElementById("ai-domain-concept").value;
    const power = +document.getElementById("ai-domain-power").value;
    const count = +document.getElementById("ai-domain-count").value;

    try {
        const out = await callAI({
            mode: "domainLair",
            domain,
            concept,
            power,
            count
        });

        // parse output into separate lines (one per action)
        const actions = out.split(/\n+/).filter(x => x.trim());

        actions.forEach(raw => {
            domain.lairs.push({
                id: uuid(),
                type: "lair",
                name: extractName(raw),
                effect: raw
            });
        });

        showMessage("Lair actions generated ✓");
        rerender();
    } catch {
        showMessage("AI generation failed.", true);
    }
};

/* Helper: Extract the first line or Name: field */
function extractName(text) {
    const m = text.match(/Name:\s*(.+)/i);
    return m ? m[1].trim() : "Lair Action";
}

/* ------------------------------------------------------------
   PANEL 5 — PLAYABLE VIEW
------------------------------------------------------------ */
function renderPlayableView() {
    renderPlayableHomies();
    renderPlayableDomains();
    renderPlayableAbilities();
}

function renderPlayableHomies() {
    const wrap = document.getElementById("playable-homies");
    wrap.innerHTML = "";

    AppState.homies.forEach(h => {
        const acc = document.createElement("div");
        acc.className = "accordion";

        const header = document.createElement("div");
        header.className = "accordion-header";
        header.textContent = h.name;

        const content = document.createElement("div");
        content.className = "accordion-content";

        content.innerHTML = `
            <p><strong>HP:</strong> ${h.hp} | <strong>AC:</strong> ${h.ac} | <strong>Move:</strong> ${h.move}</p>
            <p><strong>Attack:</strong> ${h.attack}</p>
            <div class="divider"></div>

            <h4>Abilities</h4>
            <div>
                ${AppState.abilities
                    .filter(a => a.assign === "homie-" + h.id)
                    .map(a => renderAbilityCard(a).outerHTML)
                    .join("")}
            </div>
        `;

        setupAccordion(header, content, acc);
        acc.appendChild(header);
        acc.appendChild(content);
        wrap.appendChild(acc);
    });
}

function renderPlayableDomains() {
    const wrap = document.getElementById("playable-domains");
    wrap.innerHTML = "";

    AppState.domains.forEach(d => {
        const acc = document.createElement("div");
        acc.className = "accordion";

        const header = document.createElement("div");
        header.className = "accordion-header";
        header.textContent = d.name;

        const content = document.createElement("div");
        content.className = "accordion-content";

        content.innerHTML = `
            <p><strong>Tier:</strong> ${d.tier} | <strong>Fear DC:</strong> ${d.dc}</p>
            <div class="divider"></div>

            <h4>Lair Actions</h4>
            <div>
                ${d.lairs
                    .map(a => renderAbilityCard(a).outerHTML)
                    .join("")}
            </div>
        `;

        setupAccordion(header, content, acc);
        acc.appendChild(header);
        acc.appendChild(content);
        wrap.appendChild(acc);
    });
}

function renderPlayableAbilities() {
    const wrap = document.getElementById("playable-abilities");
    wrap.innerHTML = "";

    AppState.abilities.forEach(a =>
        wrap.appendChild(renderAbilityCard(a))
    );
}

/* ------------------------------------------------------------
   AI FETCH LOGIC
------------------------------------------------------------ */
async function callAI(payload) {
    const resp = await fetch("/api/generate-soul-abilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!data.success) throw new Error("AI Error");
    return data.text;
}

/* ------------------------------------------------------------
   INIT
------------------------------------------------------------ */
Storage.load();
rerender();

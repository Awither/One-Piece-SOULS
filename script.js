// ================================
// Soul-Soul Fruit Control Panel
// ================================

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // Global banner / notifications
  // -----------------------------
  const bannerEl = document.getElementById("app-error-banner");
  const bannerTextEl = document.getElementById("app-error-text");
  const bannerCloseEl = document.getElementById("app-error-close");

  function notify(message) {
    if (!bannerEl || !bannerTextEl) return;
    bannerTextEl.textContent = message || "";
    bannerEl.classList.remove("hidden");

    // auto-hide after 5s
    window.clearTimeout(notify._timer);
    notify._timer = window.setTimeout(() => {
      bannerEl.classList.add("hidden");
    }, 5000);
  }

  if (bannerCloseEl) {
    bannerCloseEl.addEventListener("click", () => {
      bannerEl.classList.add("hidden");
    });
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (id) => document.getElementById(id);

  function uuid() {
    return "_" + Math.random().toString(16).slice(2);
  }

  function autoExpandAllTextareas() {
    document.querySelectorAll("textarea").forEach((t) => {
      const autoExpand = (el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      };
      autoExpand(t);
      t.addEventListener("input", () => autoExpand(t));
    });
  }

  // -----------------------------
  // Global state + persistence
  // -----------------------------
  let Souls = [];
  let Homies = [];
  let Domains = [];
  let Abilities = [];
  let Lairs = [];

  const STORAGE_KEYS = {
    souls: "Souls",
    homies: "Homies",
    domains: "Domains",
    abilities: "Abilities",
    lairs: "Lairs",
  };

  function loadAll() {
    try {
      Souls = JSON.parse(localStorage.getItem(STORAGE_KEYS.souls) || "[]");
      Homies = JSON.parse(localStorage.getItem(STORAGE_KEYS.homies) || "[]");
      Domains = JSON.parse(localStorage.getItem(STORAGE_KEYS.domains) || "[]");
      Abilities = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.abilities) || "[]"
      );
      Lairs = JSON.parse(localStorage.getItem(STORAGE_KEYS.lairs) || "[]");
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
      Souls = [];
      Homies = [];
      Domains = [];
      Abilities = [];
      Lairs = [];
    }
  }

  function saveAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.souls, JSON.stringify(Souls));
      localStorage.setItem(STORAGE_KEYS.homies, JSON.stringify(Homies));
      localStorage.setItem(STORAGE_KEYS.domains, JSON.stringify(Domains));
      localStorage.setItem(STORAGE_KEYS.abilities, JSON.stringify(Abilities));
      localStorage.setItem(STORAGE_KEYS.lairs, JSON.stringify(Lairs));
    } catch (e) {
      console.error("Failed to save state", e);
      notify("⚠ Could not save to localStorage.");
    }
  }

  loadAll();

  // -----------------------------
  // Tabs – show one panel at a time
  // -----------------------------
  function setupTabs() {
    const tabs = document.querySelectorAll(".app-tabs button, .app-tab");
    const panels = document.querySelectorAll(".app-panel");
    if (!tabs.length || !panels.length) return;

    function showPanel(key) {
      panels.forEach((panel) => {
        const panelKey = panel.getAttribute("data-panel");
        panel.classList.toggle("active", panelKey === key);
      });
      tabs.forEach((tab) => {
        const tabKey = tab.getAttribute("data-panel");
        tab.classList.toggle("active", tabKey === key);
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const key = tab.getAttribute("data-panel");
        if (!key) return;
        showPanel(key);
      });
    });

    // default home = Souls
    showPanel("souls");
  }

  // -----------------------------
  // Soul Panel (Panel 1)
  // -----------------------------
  const soulName = $("soul-name");
  const soulMight = $("soul-might");
  const soulTier = $("soul-tier");
  const soulWill = $("soul-will");
  const soulTags = $("soul-tags");
  const soulNotes = $("soul-notes");

  const soulRating = $("soul-rating");
  const soulLevel = $("soul-level");
  const soulSpu = $("soul-spu");
  const soulHp = $("soul-hp");

  const soulFilter = $("soul-filter");
  const soulBankList = $("soul-bank-list");

  function calculateSoul() {
    const might = parseInt(soulMight.value, 10) || 0;
    const tier = parseInt(soulTier.value, 10) || 0;
    const will = parseInt(soulWill.value, 10) || 0;

    const combined = might * 2 + tier * 3 + will * 5;
    const SoL = Math.max(1, Math.floor(combined / 10));
    const SPU = Math.floor(combined * 8.5);
    const HP = Math.floor(SoL * 2);

    soulRating.textContent = combined;
    soulLevel.textContent = SoL;
    soulSpu.textContent = SPU;
    soulHp.textContent = HP;

    return { combined, SoL, SPU, HP };
  }

  function renderSoulBank() {
    if (!soulBankList) return;
    soulBankList.textContent = "";
    const query = (soulFilter?.value || "").toLowerCase();

    Souls.forEach((soul) => {
      if (
        query &&
        !(
          (soul.name || "").toLowerCase().includes(query) ||
          (soul.tags || "").toLowerCase().includes(query)
        )
      ) {
        return;
      }

      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = soul.name || "Unnamed Soul";

      const tags = document.createElement("div");
      if (soul.tags) {
        const pill = document.createElement("span");
        pill.className = "pill pill-blue";
        pill.textContent = soul.tags;
        tags.appendChild(pill);
      }

      header.appendChild(title);
      header.appendChild(tags);
      card.appendChild(header);

      const statRow = document.createElement("div");
      statRow.className = "card-stat-row";

      const stats = [
        { label: "SoL", value: soul.level },
        { label: "SPU", value: soul.spu },
        { label: "HP Lost", value: soul.hp },
        { label: "Might", value: soul.might },
        { label: "Tier", value: soul.tier },
        { label: "Will", value: soul.will },
      ];

      stats.forEach((s) => {
        const el = document.createElement("div");
        el.className = "card-stat";
        el.innerHTML =
          `<span class="card-stat-label">${s.label}:</span> ${s.value ?? "—"}`;
        statRow.appendChild(el);
      });

      card.appendChild(statRow);

      if (soul.notes) {
        const notes = document.createElement("div");
        notes.style.fontSize = "0.8rem";
        notes.style.color = "var(--text-soft)";
        notes.textContent = soul.notes;
        card.appendChild(notes);
      }

      const footer = document.createElement("div");
      footer.className = "card-footer";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Souls = Souls.filter((s) => s.id !== soul.id);
        saveAll();
        renderSoulBank();
        refreshDropdowns();
        notify("🗑 Soul removed from bank.");
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      soulBankList.appendChild(card);
    });
  }

  function setupSoulPanel() {
    const recalcBtn = $("btn-recalc-soul");
    const addBtn = $("btn-add-soul");

    if (recalcBtn) {
      recalcBtn.addEventListener("click", () => {
        calculateSoul();
        notify("Soul rating recalculated.");
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const { combined, SoL, SPU, HP } = calculateSoul();
        const name = (soulName.value || "").trim();
        if (!name) {
          notify("Give this soul a name before adding it.");
          return;
        }

        const newSoul = {
          id: uuid(),
          name,
          might: parseInt(soulMight.value, 10) || 0,
          tier: parseInt(soulTier.value, 10) || 0,
          will: parseInt(soulWill.value, 10) || 0,
          rating: combined,
          level: SoL,
          spu: SPU,
          hp: HP,
          tags: soulTags.value || "",
          notes: soulNotes.value || "",
        };

        Souls.push(newSoul);
        saveAll();
        renderSoulBank();
        refreshDropdowns();
        notify("✔ Soul added to bank.");
      });
    }

    if (soulFilter) {
      soulFilter.addEventListener("input", renderSoulBank);
    }

    // Initial calc & render
    calculateSoul();
    renderSoulBank();
  }

  // -----------------------------
  // Homies (Panel 2)
  // -----------------------------
  const homieName = $("homie-name");
  const homieType = $("homie-type");
  const homieLinkedSoul = $("homie-linked-soul");
  const homieSpu = $("homie-spu");
  const homieRole = $("homie-role");
  const homieHp = $("homie-hp");
  const homieAc = $("homie-ac");
  const homieMove = $("homie-move");
  const homieAttack = $("homie-attack");
  const homiePersonality = $("homie-personality");
  const homieLocation = $("homie-location");
  const homieDomain = $("homie-domain");
  const homieNotes = $("homie-notes");
  const homieFilter = $("homie-filter");
  const homieList = $("homie-list");

  function renderHomies() {
    if (!homieList) return;
    homieList.textContent = "";
    const query = (homieFilter?.value || "").toLowerCase();

    Homies.forEach((homie) => {
      if (
        query &&
        !(
          (homie.name || "").toLowerCase().includes(query) ||
          (homie.role || "").toLowerCase().includes(query)
        )
      ) {
        return;
      }

      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = homie.name || "Unnamed Homie";

      const pill = document.createElement("span");
      pill.className = "pill pill-pink";
      pill.textContent = homie.type || "Homie";

      header.appendChild(title);
      header.appendChild(pill);
      card.appendChild(header);

      const sub = document.createElement("div");
      sub.className = "card-subtitle";
      sub.textContent = homie.role || "";
      card.appendChild(sub);

      const statRow = document.createElement("div");
      statRow.className = "card-stat-row";

      const statPairs = [
        { label: "SPU", value: homie.spu },
        { label: "HP", value: homie.hp },
        { label: "AC", value: homie.ac },
        { label: "Move", value: homie.move },
      ];

      statPairs.forEach((s) => {
        const el = document.createElement("div");
        el.className = "card-stat";
        el.innerHTML =
          `<span class="card-stat-label">${s.label}:</span> ${s.value ?? "—"}`;
        statRow.appendChild(el);
      });

      card.appendChild(statRow);

      if (homie.attack) {
        const atk = document.createElement("div");
        atk.style.fontSize = "0.82rem";
        atk.style.color = "var(--text-soft)";
        atk.textContent = `Attack: ${homie.attack}`;
        card.appendChild(atk);
      }

      if (homie.personality) {
        const pers = document.createElement("div");
        pers.style.fontSize = "0.8rem";
        pers.style.color = "var(--text-muted)";
        pers.textContent = `Personality: ${homie.personality}`;
        card.appendChild(pers);
      }

      if (homie.location) {
        const loc = document.createElement("div");
        loc.style.fontSize = "0.8rem";
        loc.style.color = "var(--text-muted)";
        loc.textContent = `Location: ${homie.location}`;
        card.appendChild(loc);
      }

      if (homie.notes) {
        const notes = document.createElement("div");
        notes.style.fontSize = "0.8rem";
        notes.style.color = "var(--text-soft)";
        notes.textContent = homie.notes;
        card.appendChild(notes);
      }

      const footer = document.createElement("div");
      footer.className = "card-footer";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Homies = Homies.filter((h) => h.id !== homie.id);
        saveAll();
        renderHomies();
        refreshDropdowns();
        notify("🗑 Homie deleted.");
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      homieList.appendChild(card);
    });
  }

  function setupHomiesPanel() {
    const createBtn = $("btn-create-homie");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        const name = (homieName.value || "").trim();
        if (!name) {
          notify("Name your homie first.");
          return;
        }

        const h = {
          id: uuid(),
          name,
          type: homieType?.value || "Homie",
          linkedSoulId: homieLinkedSoul?.value || "",
          spu: parseInt(homieSpu.value, 10) || 0,
          role: homieRole.value || "",
          hp: parseInt(homieHp.value, 10) || 0,
          ac: parseInt(homieAc.value, 10) || 0,
          move: parseInt(homieMove.value, 10) || 0,
          attack: homieAttack.value || "",
          personality: homiePersonality.value || "",
          location: homieLocation.value || "",
          domainId: homieDomain?.value || "",
          notes: homieNotes.value || "",
        };

        Homies.push(h);
        saveAll();
        renderHomies();
        refreshDropdowns();
        notify("✔ Homie created.");
      });
    }

    if (homieFilter) {
      homieFilter.addEventListener("input", renderHomies);
    }

    renderHomies();
  }

  // -----------------------------
  // Domains & Lairs (Panel 4)
  // -----------------------------
  const domainName = $("domain-name");
  const domainTier = $("domain-tier");
  const domainSpu = $("domain-spu");
  const domainRange = $("domain-range");
  const domainDc = $("domain-dc");
  const domainPersonality = $("domain-personality");
  const domainNotes = $("domain-notes");
  const domainHomiesSelect = $("domain-homies");
  const domainFilter = $("domain-filter");
  const domainList = $("domain-list");

  const lairDomain = $("lair-domain");
  const lairPower = $("lair-power");
  const lairCount = $("lair-count");
  const lairConcept = $("lair-concept");
  const lairList = $("lair-list");

  let lastLairRequest = null;

  function renderDomains() {
    if (!domainList) return;
    domainList.textContent = "";
    const query = (domainFilter?.value || "").toLowerCase();

    Domains.forEach((dom) => {
      if (
        query &&
        !(dom.name || "").toLowerCase().includes(query)
      ) {
        return;
      }

      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header-line";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = dom.name || "Unnamed Domain";

      const pill = document.createElement("span");
      pill.className = "pill pill-gold";
      pill.textContent = `Tier ${dom.tier ?? "?"}`;

      header.appendChild(title);
      header.appendChild(pill);
      card.appendChild(header);

      const statRow = document.createElement("div");
      statRow.className = "card-stat-row";
      const stats = [
        { label: "SPU", value: dom.spu },
        { label: "Fear DC", value: dom.dc },
        { label: "Range", value: dom.range || "—" },
      ];
      stats.forEach((s) => {
        const el = document.createElement("div");
        el.className = "card-stat";
        el.innerHTML =
          `<span class="card-stat-label">${s.label}:</span> ${s.value ?? "—"}`;
        statRow.appendChild(el);
      });
      card.appendChild(statRow);

      if (dom.personality) {
        const pers = document.createElement("div");
        pers.style.fontSize = "0.84rem";
        pers.style.color = "var(--text-soft)";
        pers.textContent = dom.personality;
        card.appendChild(pers);
      }

      // list assigned homies
      if (Array.isArray(dom.homies) && dom.homies.length) {
        const names = dom.homies
          .map((hid) => Homies.find((h) => h.id === hid))
          .filter(Boolean)
          .map((h) => h.name);
        if (names.length) {
          const homieLine = document.createElement("div");
          homieLine.style.fontSize = "0.8rem";
          homieLine.style.color = "var(--text-muted)";
          homieLine.textContent = `Territory Homies: ${names.join(", ")}`;
          card.appendChild(homieLine);
        }
      }

      const footer = document.createElement("div");
      footer.className = "card-footer";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Domains = Domains.filter((d) => d.id !== dom.id);
        // clean references
        Homies.forEach((h) => {
          if (h.domainId === dom.id) h.domainId = "";
        });
        Abilities.forEach((a) => {
          if (a.assignType === "domain" && a.assignId === dom.id) {
            a.assignType = "general";
            a.assignId = "";
          }
        });
        Lairs = Lairs.filter((l) => l.domainId !== dom.id);

        saveAll();
        renderDomains();
        renderLairs();
        refreshDropdowns();
        notify("🗑 Domain deleted.");
      });

      footer.appendChild(delBtn);
      card.appendChild(footer);

      domainList.appendChild(card);
    });
  }

  function renderLairs() {
    if (!lairList) return;
    lairList.textContent = "";

    Lairs.forEach((lair) => {
      const card = document.createElement("div");
      card.className = "card lair-card";

      const header = document.createElement("div");
      header.className = "lair-header";

      const nameEl = document.createElement("div");
      nameEl.className = "lair-name";
      nameEl.textContent = lair.name || "Lair Action";

      const powerPill = document.createElement("span");
      powerPill.className = "power-pill";
      powerPill.textContent = `Pwr ${lair.power ?? "—"}`;

      header.appendChild(nameEl);
      header.appendChild(powerPill);
      card.appendChild(header);

      const roleStrip = document.createElement("div");
      roleStrip.className = "lair-role-strip";
      const dom = Domains.find((d) => d.id === lair.domainId);
      roleStrip.textContent = dom
        ? `Domain: ${dom.name}`
        : "Domain: —";
      card.appendChild(roleStrip);

      if (lair.summary) {
        const sum = document.createElement("p");
        sum.className = "lair-summary";
        sum.textContent = lair.summary;
        card.appendChild(sum);
      }

      const stats = document.createElement("div");
      stats.className = "lair-stats";
      const sEl = document.createElement("div");
      sEl.innerHTML =
        `<span class="stat-label">Timing</span>` +
        `<span class="stat-value">${lair.timing || "Lair Action (Initiative 20)"}</span>`;
      stats.appendChild(sEl);
      card.appendChild(stats);

      const effect = document.createElement("div");
      effect.className = "lair-effect";
      effect.innerHTML =
        `<strong>Effect:</strong> ${lair.text || ""}`;
      card.appendChild(effect);

      if (lair.extra) {
        const extra = document.createElement("div");
        extra.className = "lair-extra";
        extra.textContent = lair.extra;
        card.appendChild(extra);
      }

      const footer = document.createElement("div");
      footer.className = "card-footer";

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn btn-secondary";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            `${lair.name}\n${lair.summary || ""}\n\n${lair.text || ""}`
          );
          notify("📋 Lair action copied.");
        } catch {
          notify("Could not copy to clipboard.");
        }
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        Lairs = Lairs.filter((x) => x.id !== lair.id);
        saveAll();
        renderLairs();
        notify("🗑 Lair action deleted.");
      });

      footer.appendChild(copyBtn);
      footer.appendChild(delBtn);
      card.appendChild(footer);

      lairList.appendChild(card);
    });
  }

  async function callLairAI(payload) {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("Network error");
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "AI returned failure for lair actions.");
    }
    return data;
  }

  function setupDomainsPanel() {
    const saveDomainBtn = $("btn-save-domain");
    const genLairBtn = $("btn-generate-lairs");
    const rerollLairBtn = $("btn-reroll-lairs");

    if (saveDomainBtn) {
      saveDomainBtn.addEventListener("click", () => {
        const name = (domainName.value || "").trim();
        if (!name) {
          notify("Name your domain first.");
          return;
        }

        const selectedHomies = [];
        if (domainHomiesSelect) {
          Array.from(domainHomiesSelect.options).forEach((opt) => {
            if (opt.selected && opt.value) selectedHomies.push(opt.value);
          });
        }

        const dom = {
          id: uuid(),
          name,
          tier: parseInt(domainTier.value, 10) || 0,
          spu: parseInt(domainSpu.value, 10) || 0,
          range: domainRange.value || "",
          dc: parseInt(domainDc.value, 10) || 0,
          personality: domainPersonality.value || "",
          notes: domainNotes.value || "",
          homies: selectedHomies,
        };

        Domains.push(dom);
        saveAll();
        renderDomains();
        refreshDropdowns();
        notify("✔ Domain saved.");
      });
    }

    if (domainFilter) {
      domainFilter.addEventListener("input", renderDomains);
    }

    if (genLairBtn) {
      genLairBtn.addEventListener("click", async () => {
        const domainId = lairDomain?.value || "";
        if (!domainId) {
          notify("Select a domain first for lair actions.");
          return;
        }
        const power = parseInt(lairPower?.value, 10) || 10;
        const count = Math.max(1, Math.min(5, parseInt(lairCount?.value, 10) || 1));
        const concept = lairConcept?.value || "";
        const domainObj = Domains.find((d) => d.id === domainId);
        if (!domainObj) {
          notify("Selected domain not found.");
          return;
        }

        const payload = {
          mode: "domainLair",
          domainId,
          power,
          count,
          concept,
          souls: Souls,
          homies: Homies,
          domains: Domains,
        };

        lastLairRequest = payload;

        try {
          notify("⏳ Asking AI for lair actions…");
          const data = await callLairAI(payload);

          // Expecting data.lairs = [{ name, summary, text, power }]
          const lairsFromAI = Array.isArray(data.lairs)
            ? data.lairs
            : [{ name: data.name || domainObj.name + " Lair Action", summary: "", text: data.text || "", power }];

          lairsFromAI.forEach((L) => {
            const lairObj = {
              id: uuid(),
              domainId,
              name: L.name || "Lair Action",
              power: L.power ?? power,
              summary: L.summary || "",
              text: L.text || data.text || "",
              timing: L.timing || "",
              extra: L.extra || "",
            };
            Lairs.push(lairObj);
          });

          saveAll();
          renderLairs();
          notify("✔ Lair actions generated.");
        } catch (err) {
          console.error(err);
          notify("❌ Lair action AI failed.");
        }
      });
    }

    if (rerollLairBtn) {
      rerollLairBtn.addEventListener("click", async () => {
        if (!lastLairRequest) {
          notify("No previous lair action request to reroll.");
          return;
        }
        try {
          notify("⏳ Rerolling lair actions…");
          const data = await callLairAI(lastLairRequest);
          const domainId = lastLairRequest.domainId;
          const domainObj = Domains.find((d) => d.id === domainId);
          const power = lastLairRequest.power || 10;

          const lairsFromAI = Array.isArray(data.lairs)
            ? data.lairs
            : [{ name: data.name || domainObj?.name || "Lair Action", summary: "", text: data.text || "", power }];

          // Remove previous lairs for this domain produced by last request?
          // Simple approach: keep all; DM can delete manually if they want.

          lairsFromAI.forEach((L) => {
            const lairObj = {
              id: uuid(),
              domainId,
              name: L.name || "Lair Action",
              power: L.power ?? power,
              summary: L.summary || "",
              text: L.text || data.text || "",
              timing: L.timing || "",
              extra: L.extra || "",
            };
            Lairs.push(lairObj);
          });

          saveAll();
          renderLairs();
          notify("✔ Lair actions rerolled.");
        } catch (err) {
          console.error(err);
          notify("❌ Lair action reroll failed.");
        }
      });
    }

    renderDomains();
    renderLairs();
  }

  // -----------------------------
  // Abilities (Panel 3)
  // -----------------------------
  const abilityName = $("ability-name");
  const abilityPower = $("ability-power");
  const abilitySummary = $("ability-summary");
  const abilityAction = $("ability-action");
  const abilityRange = $("ability-range");
  const abilityTarget = $("ability-target");
  const abilitySave = $("ability-save");
  const abilityDamage = $("ability-damage");
  const abilityEffect = $("ability-effect");
  const abilityCombo = $("ability-combo");
  const abilityAssign = $("ability-assign");
  const abilityFilter = $("ability-filter");
  const abilityList = $("ability-list");

  const aiAbilityPower = $("ai-ability-power");
  const aiAbilityRole = $("ai-ability-role");
  const aiAbilityConcept = $("ai-ability-concept");
  const aiAbilityAssign = $("ai-ability-assign");
  const btnAbilitySaveManual = $("btn-ability-save-manual");
  const btnAbilityGenerateAI = $("btn-ability-generate-ai");
  const btnAbilityReroll = $("btn-ability-reroll");

  let lastAbilityRequest = null;

  function parseAssign(value) {
    // "general" | "homie:<id>" | "domain:<id>"
    if (!value || value === "general") return { type: "general", id: "" };
    if (value.startsWith("homie:")) {
      return { type: "homie", id: value.slice(6) };
    }
    if (value.startsWith("domain:")) {
      return { type: "domain", id: value.slice(7) };
    }
    return { type: "general", id: "" };
  }

  function buildAssignLabel(ability) {
    if (ability.assignType === "homie") {
      const h = Homies.find((x) => x.id === ability.assignId);
      return h ? `Homie: ${h.name}` : "Homie (missing)";
    }
    if (ability.assignType === "domain") {
      const d = Domains.find((x) => x.id === ability.assignId);
      return d ? `Domain: ${d.name}` : "Domain (missing)";
    }
    return "General / Party";
  }

  function createAbilityCard(ability) {
    const card = document.createElement("div");
    card.className = "card ability-card";

    const header = document.createElement("div");
    header.className = "ability-header";

    const nameEl = document.createElement("div");
    nameEl.className = "ability-name";
    nameEl.textContent = ability.name || "Unnamed Ability";

    const powerPill = document.createElement("span");
    powerPill.className = "power-pill";
    powerPill.textContent = `Pwr ${ability.power ?? "—"}`;

    header.appendChild(nameEl);
    header.appendChild(powerPill);
    card.appendChild(header);

    const roleStrip = document.createElement("div");
    roleStrip.className = "ability-role-strip";
    roleStrip.textContent = `${buildAssignLabel(ability)} · ${
      ability.source === "ai" ? "AI-Generated" : "Manual"
    }`;
    card.appendChild(roleStrip);

    if (ability.summary) {
      const sum = document.createElement("p");
      sum.className = "ability-summary";
      sum.textContent = ability.summary;
      card.appendChild(sum);
    }

    const stats = document.createElement("div");
    stats.className = "ability-stats";

    const statItems = [
      { label: "Action", value: ability.action },
      { label: "Range", value: ability.range },
      { label: "Target", value: ability.target },
      { label: "Save / DC", value: ability.save },
      { label: "Damage", value: ability.damage },
    ];

    statItems.forEach((s) => {
      const i = document.createElement("div");
      i.innerHTML =
        `<span class="stat-label">${s.label}</span>` +
        `<span class="stat-value">${s.value || "—"}</span>`;
      stats.appendChild(i);
    });
    card.appendChild(stats);

    const effect = document.createElement("div");
    effect.className = "ability-effect";
    effect.innerHTML =
      `<strong>Effect:</strong> ${ability.effect || ""}`;
    card.appendChild(effect);

    if (ability.combo) {
      const combo = document.createElement("div");
      combo.className = "ability-combo";
      combo.textContent = ability.combo;
      card.appendChild(combo);
    }

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-secondary";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const text =
        `${ability.name}\n` +
        (ability.summary ? ability.summary + "\n" : "") +
        `Action: ${ability.action || "—"} | Range: ${
          ability.range || "—"
        } | Target: ${ability.target || "—"} | Save/DC: ${
          ability.save || "—"
        } | Damage: ${ability.damage || "—"}\n\n` +
        (ability.effect || "") +
        (ability.combo ? `\n\nCombo: ${ability.combo}` : "");
      try {
        await navigator.clipboard.writeText(text);
        notify("📋 Ability copied.");
      } catch {
        notify("Could not copy ability to clipboard.");
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      Abilities = Abilities.filter((a) => a.id !== ability.id);
      saveAll();
      renderAbilities();
      renderPlayableView(); // update playable view lists
      notify("🗑 Ability deleted.");
    });

    footer.appendChild(copyBtn);
    footer.appendChild(delBtn);
    card.appendChild(footer);

    return card;
  }

  function renderAbilities() {
    if (!abilityList) return;
    abilityList.textContent = "";
    const query = (abilityFilter?.value || "").toLowerCase();

    Abilities.forEach((ability) => {
      if (
        query &&
        !(
          (ability.name || "").toLowerCase().includes(query) ||
          (ability.summary || "").toLowerCase().includes(query)
        )
      ) {
        return;
      }
      const card = createAbilityCard(ability);
      abilityList.appendChild(card);
    });
  }

  async function callAbilityAI(payload) {
    const res = await fetch("/api/generate-soul-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("Network error");
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "AI returned failure.");
    }
    return data;
  }

  function setupAbilitiesPanel() {
    if (btnAbilitySaveManual) {
      btnAbilitySaveManual.addEventListener("click", () => {
        const name = (abilityName.value || "").trim();
        if (!name) {
          notify("Name your ability first.");
          return;
        }

        const power = parseInt(abilityPower.value, 10) || 0;
        const { type, id } = parseAssign(abilityAssign?.value || "general");

        const ability = {
          id: uuid(),
          name,
          power,
          summary: abilitySummary.value || "",
          action: abilityAction.value || "",
          range: abilityRange.value || "",
          target: abilityTarget.value || "",
          save: abilitySave.value || "",
          damage: abilityDamage.value || "",
          effect: abilityEffect.value || "",
          combo: abilityCombo.value || "",
          assignType: type,
          assignId: id,
          source: "manual",
        };

        Abilities.push(ability);
        saveAll();
        renderAbilities();
        renderPlayableView();
        notify("✔ Ability saved.");
      });
    }

    if (btnAbilityGenerateAI) {
      btnAbilityGenerateAI.addEventListener("click", async () => {
        const power = parseInt(aiAbilityPower.value, 10) || 10;
        const role = aiAbilityRole?.value || "Offense";
        const concept = aiAbilityConcept?.value || "";
        const assignRaw = aiAbilityAssign?.value || "general";
        const { type, id } = parseAssign(assignRaw);

        if (!concept) {
          notify("Describe what kind of ability you want.");
          return;
        }

        const payload = {
          mode: "genericAbility",
          // minimal fields; backend prompt can infer the rest
          name: "",
          target: "",
          action: "",
          range: "",
          tgtinfo: "",
          dc: "",
          dmg: "",
          power,
          soulCost: 0,
          types: [role],
          outcomes: [],
          effectNotes: concept,
          outcomeNotes: "",
          mechNotes: "",
          comboNotes: "",
          souls: Souls,
          homies: Homies,
          domains: Domains,
        };

        lastAbilityRequest = payload;

        try {
          notify("⏳ Asking AI to forge a Soul ability…");
          const data = await callAbilityAI(payload);
          const text = data.text || "";
          const firstLineBreak = text.indexOf("\n");
          const rawName =
            firstLineBreak > 0 ? text.slice(0, firstLineBreak).trim() : "";
          const body = firstLineBreak > 0 ? text.slice(firstLineBreak + 1).trim() : text.trim();

          // crude summary = first sentence
          const dotIndex = body.indexOf(".");
          const summary =
            dotIndex > 0 ? body.slice(0, dotIndex + 1).trim() : "";

          const ability = {
            id: uuid(),
            name: rawName || "AI-Generated Ability",
            power,
            summary,
            action: "",
            range: "",
            target: "",
            save: "",
            damage: "",
            effect: body,
            combo: "",
            assignType: type,
            assignId: id,
            source: "ai",
          };

          Abilities.push(ability);
          saveAll();
          renderAbilities();
          renderPlayableView();
          notify("✔ AI ability generated.");
        } catch (err) {
          console.error(err);
          notify("❌ Ability AI failed.");
        }
      });
    }

    if (btnAbilityReroll) {
      btnAbilityReroll.addEventListener("click", async () => {
        if (!lastAbilityRequest) {
          notify("No previous AI ability request to reroll.");
          return;
        }
        try {
          notify("⏳ Rerolling last AI ability…");
          const data = await callAbilityAI(lastAbilityRequest);
          const text = (data.text || "").trim();
          const power = lastAbilityRequest.power || 10;

          const firstLineBreak = text.indexOf("\n");
          const rawName =
            firstLineBreak > 0 ? text.slice(0, firstLineBreak).trim() : "";
          const body = firstLineBreak > 0 ? text.slice(firstLineBreak + 1).trim() : text;

          const dotIndex = body.indexOf(".");
          const summary =
            dotIndex > 0 ? body.slice(0, dotIndex + 1).trim() : "";

          // For reroll we keep assignment from last ability we added? simpler: general.
          const ability = {
            id: uuid(),
            name: rawName || "AI-Generated Ability",
            power,
            summary,
            action: "",
            range: "",
            target: "",
            save: "",
            damage: "",
            effect: body,
            combo: "",
            assignType: "general",
            assignId: "",
            source: "ai",
          };

          Abilities.push(ability);
          saveAll();
          renderAbilities();
          renderPlayableView();
          notify("✔ AI ability rerolled.");
        } catch (err) {
          console.error(err);
          notify("❌ Ability reroll failed.");
        }
      });
    }

    if (abilityFilter) {
      abilityFilter.addEventListener("input", renderAbilities);
    }

    renderAbilities();
  }

  // -----------------------------
  // Playable View (Panel 5)
  // -----------------------------
  const playHomieSelect = $("play-homie-select");
  const playHomieDetails = $("play-homie-details");
  const playDomainSelect = $("play-domain-select");
  const playDomainDetails = $("play-domain-details");
  const playGeneralAbilities = $("play-general-abilities");

  function renderPlayableView() {
    if (!playGeneralAbilities) return;

    // General abilities
    playGeneralAbilities.textContent = "";
    Abilities.filter((a) => a.assignType === "general").forEach((a) => {
      const card = createAbilityCard(a);
      playGeneralAbilities.appendChild(card);
    });

    // Currently selected homie / domain
    renderPlayableHomie();
    renderPlayableDomain();
  }

  function renderPlayableHomie() {
    if (!playHomieDetails) return;
    playHomieDetails.textContent = "";
    const id = playHomieSelect?.value || "";
    if (!id) return;

    const homie = Homies.find((h) => h.id === id);
    if (!homie) return;

    // Homie card
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header-line";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = homie.name;

    const pill = document.createElement("span");
    pill.className = "pill pill-pink";
    pill.textContent = homie.type || "Homie";

    header.appendChild(title);
    header.appendChild(pill);
    card.appendChild(header);

    const statRow = document.createElement("div");
    statRow.className = "card-stat-row";
    const stats = [
      { label: "SPU", value: homie.spu },
      { label: "HP", value: homie.hp },
      { label: "AC", value: homie.ac },
      { label: "Move", value: homie.move },
    ];
    stats.forEach((s) => {
      const el = document.createElement("div");
      el.className = "card-stat";
      el.innerHTML =
        `<span class="card-stat-label">${s.label}:</span> ${s.value ?? "—"}`;
      statRow.appendChild(el);
    });
    card.appendChild(statRow);

    if (homie.attack) {
      const atk = document.createElement("div");
      atk.style.fontSize = "0.82rem";
      atk.style.color = "var(--text-soft)";
      atk.textContent = `Attack: ${homie.attack}`;
      card.appendChild(atk);
    }

    if (homie.personality) {
      const pers = document.createElement("div");
      pers.style.fontSize = "0.8rem";
      pers.style.color = "var(--text-muted)";
      pers.textContent = homie.personality;
      card.appendChild(pers);
    }

    playHomieDetails.appendChild(card);

    // Abilities assigned to this homie
    const assigned = Abilities.filter(
      (a) => a.assignType === "homie" && a.assignId === id
    );
    if (assigned.length) {
      assigned.forEach((a) => {
        const abCard = createAbilityCard(a);
        playHomieDetails.appendChild(abCard);
      });
    }
  }

  function renderPlayableDomain() {
    if (!playDomainDetails) return;
    playDomainDetails.textContent = "";
    const id = playDomainSelect?.value || "";
    if (!id) return;

    const dom = Domains.find((d) => d.id === id);
    if (!dom) return;

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header-line";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = dom.name;

    const pill = document.createElement("span");
    pill.className = "pill pill-gold";
    pill.textContent = `Tier ${dom.tier ?? "?"}`;

    header.appendChild(title);
    header.appendChild(pill);
    card.appendChild(header);

    const statRow = document.createElement("div");
    statRow.className = "card-stat-row";
    const stats = [
      { label: "SPU", value: dom.spu },
      { label: "Fear DC", value: dom.dc },
      { label: "Range", value: dom.range || "—" },
    ];
    stats.forEach((s) => {
      const el = document.createElement("div");
      el.className = "card-stat";
      el.innerHTML =
        `<span class="card-stat-label">${s.label}:</span> ${s.value ?? "—"}`;
      statRow.appendChild(el);
    });
    card.appendChild(statRow);

    if (dom.personality) {
      const pers = document.createElement("div");
      pers.style.fontSize = "0.84rem";
      pers.style.color = "var(--text-soft)";
      pers.textContent = dom.personality;
      card.appendChild(pers);
    }

    playDomainDetails.appendChild(card);

    // Lairs for this domain
    const lairs = Lairs.filter((l) => l.domainId === id);
    lairs.forEach((l) => {
      const lairCard = createAbilityCard({
        name: l.name,
        power: l.power,
        summary: l.summary,
        action: "Lair Action",
        range: "",
        target: "",
        save: "",
        damage: "",
        effect: l.text,
        combo: l.extra,
        assignType: "domain",
        assignId: id,
        source: "ai",
      });
      playDomainDetails.appendChild(lairCard);
    });

    // Abilities assigned directly to this domain
    const assigned = Abilities.filter(
      (a) => a.assignType === "domain" && a.assignId === id
    );
    assigned.forEach((a) => {
      const abCard = createAbilityCard(a);
      playDomainDetails.appendChild(abCard);
    });
  }

  function setupPlayablePanel() {
    if (playHomieSelect) {
      playHomieSelect.addEventListener("change", renderPlayableHomie);
    }
    if (playDomainSelect) {
      playDomainSelect.addEventListener("change", renderPlayableDomain);
    }

    renderPlayableView();
  }

  // -----------------------------
  // Dropdown syncing
  // -----------------------------
  function refreshDropdowns() {
    // Souls -> homie-linked-soul
    if (homieLinkedSoul) {
      homieLinkedSoul.textContent = "";
      const noneOpt = document.createElement("option");
      noneOpt.value = "";
      noneOpt.textContent = "— None —";
      homieLinkedSoul.appendChild(noneOpt);

      Souls.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name || "Unnamed Soul";
        homieLinkedSoul.appendChild(opt);
      });
    }

    // Domains -> homie-domain, lair-domain, play-domain-select
    const domainTargets = [homieDomain, lairDomain, playDomainSelect];
    domainTargets.forEach((sel) => {
      if (!sel) return;
      const current = sel.value;
      sel.textContent = "";
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent =
        sel === playDomainSelect ? "Select a domain…" : "— None —";
      sel.appendChild(defaultOpt);
      Domains.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name || "Unnamed Domain";
        sel.appendChild(opt);
      });
      // try to restore selection
      if (current) {
        sel.value = current;
      }
    });

    // Domain homies multi select (all homies)
    if (domainHomiesSelect) {
      const selectedValues = Array.from(domainHomiesSelect.options)
        .filter((o) => o.selected)
        .map((o) => o.value);
      domainHomiesSelect.textContent = "";
      Homies.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = h.name || "Unnamed Homie";
        if (selectedValues.includes(h.id)) {
          opt.selected = true;
        }
        domainHomiesSelect.appendChild(opt);
      });
    }

    // Ability assign dropdowns: ability-assign, ai-ability-assign
    const assignDropdowns = [abilityAssign, aiAbilityAssign];
    assignDropdowns.forEach((sel) => {
      if (!sel) return;
      const current = sel.value;
      sel.textContent = "";

      const genOpt = document.createElement("option");
      genOpt.value = "general";
      genOpt.textContent = "General / Party";
      sel.appendChild(genOpt);

      // Homies
      Homies.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = "homie:" + h.id;
        opt.textContent = `Homie – ${h.name}`;
        sel.appendChild(opt);
      });

      // Domains
      Domains.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = "domain:" + d.id;
        opt.textContent = `Domain – ${d.name}`;
        sel.appendChild(opt);
      });

      sel.value = current || "general";
    });

    // Playable homie select
    if (playHomieSelect) {
      const current = playHomieSelect.value;
      playHomieSelect.textContent = "";
      const def = document.createElement("option");
      def.value = "";
      def.textContent = "Select a homie…";
      playHomieSelect.appendChild(def);
      Homies.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h.id;
        opt.textContent = h.name || "Unnamed Homie";
        playHomieSelect.appendChild(opt);
      });
      playHomieSelect.value = current;
    }

    renderPlayableView();
  }

  // -----------------------------
  // Init
  // -----------------------------
  autoExpandAllTextareas();
  setupTabs();
  setupSoulPanel();
  setupHomiesPanel();
  setupDomainsPanel();
  setupAbilitiesPanel();
  setupPlayablePanel();
  refreshDropdowns();
});

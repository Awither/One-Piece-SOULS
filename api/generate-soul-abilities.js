import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ success: false, error: "OPENAI_API_KEY is not set" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error("Bad JSON body", err);
    return res
      .status(400)
      .json({ success: false, error: "Invalid JSON body" });
  }

  const { mode } = body || {};
  if (!mode) {
    return res
      .status(400)
      .json({ success: false, error: "Missing 'mode' in body" });
  }

  try {
    if (mode === "genericAbility") {
      const text = await handleGenericAbility(body);
      return res.status(200).json({ success: true, text });
    }

    if (mode === "homieAttack") {
      const text = await handleHomieAttack(body);
      return res.status(200).json({ success: true, text });
    }

    if (mode === "domainLair") {
      const actions = await handleDomainLair(body);
      return res.status(200).json({ success: true, actions });
    }

    return res
      .status(400)
      .json({ success: false, error: `Unknown mode: ${mode}` });
  } catch (err) {
    console.error("AI handler error", err);
    return res
      .status(500)
      .json({ success: false, error: "AI generation failed" });
  }
}

async function chat(prompt) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.85,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a rules-savvy D&D 5e designer working in a One Piece / Big Mom Soul-Soul Fruit setting. Be flavorful but mechanically clear.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  return completion.choices?.[0]?.message?.content?.trim() || "";
}

async function handleGenericAbility(body) {
  const {
    name,
    ownerKey,
    action,
    range,
    target,
    dc,
    damage,
    power,
    soulCost,
    types,
    outcomes,
    effectNotes,
    outcomeNotes,
    mechNotes,
    comboNotes,
    souls,
    homies,
    domains,
  } = body;

  let ownerLabel = "General / party-wide technique";
  if (ownerKey?.startsWith("homie:")) {
    const id = ownerKey.slice(6);
    const h = (homies || []).find((x) => x.id === id);
    if (h) ownerLabel = `Homie ability for ${h.name}, a ${h.role || h.type}.`;
  } else if (ownerKey?.startsWith("domain:")) {
    const id = ownerKey.slice(7);
    const d = (domains || []).find((x) => x.id === id);
    if (d) ownerLabel = `Domain technique used within ${d.name}.`;
  }

  const soulSummary =
    (souls || [])
      .slice(0, 4)
      .map(
        (s) =>
          `${s.name} (Rating ${s.rating}, SoL ${s.level}, ${s.spu} SPU, traits: ${s.tags})`
      )
      .join("\n") || "Various harvested souls from powerful foes.";

  const homieSummary =
    (homies || [])
      .slice(0, 4)
      .map(
        (h) =>
          `${h.name} – ${h.type}, role ${h.role}, HP ${h.hp}, AC ${h.ac}, attack ${h.attack}`
      )
      .join("\n") || "No specific Homies referenced.";

  const domainSummary =
    (domains || [])
      .slice(0, 3)
      .map(
        (d) =>
          `${d.name} – Tier ${d.tier}, Fear DC ${d.dc}, range ${d.range}, personality: ${d.personality}`
      )
      .join("\n") || "No specific Domains referenced.";

  const prompt = `
Forge a new Soul-Soul Fruit style ability for D&D 5e.

Name (suggested): ${name || "You can rename this ability appropriately."}
Owner: ${ownerLabel}
Desired effect / concept:
${effectNotes || outcomeNotes || mechNotes || "Make something thematic and cool."}

Mechanical scaffolding:
- Action type: ${action || "Choose what fits best."}
- Range: ${range || "Choose what fits best."}
- Target: ${target || "Choose what fits best."}
- Save / DC text: ${dc || "Choose a reasonable DC or '—'."}
- Damage dice: ${damage || "Choose damage dice appropriate to the power level."}
- Approximate power level (1–10, 10 is godlike with huge drawback): ${power || 6}
- Soul Energy cost (SPU): ${soulCost || 0}

Effect tags: ${Array.isArray(types) && types.length ? types.join(", ") : "Any"}
Outcome / Shape tags: ${
    Array.isArray(outcomes) && outcomes.length ? outcomes.join(", ") : "Any"
  }

Helpful world context:
Harvested Souls:
${soulSummary}

Homies:
${homieSummary}

Domains:
${domainSummary}

Combo / interaction notes:
${comboNotes || "You may suggest how this combines with Homies, Domains, or souls."}

Write the result as a short description focused on what the ability does mechanically and thematically.
Do NOT explain the reasoning. Just give the final ability text that a DM could paste into a sheet.
`;

  return chat(prompt);
}

async function handleHomieAttack(body) {
  const { targetHomieId, concept, power, types, homies, souls, domains } =
    body;

  const homie =
    (homies || []).find((h) => h.id === targetHomieId) ||
    homies?.[0] ||
    null;

  const homieLine = homie
    ? `${homie.name}, a ${homie.type} Homie, role ${homie.role}, HP ${homie.hp}, AC ${homie.ac}, attack ${homie.attack}.`
    : "A generic powerful Homie.";

  const soulSummary =
    (souls || [])
      .slice(0, 3)
      .map(
        (s) =>
          `${s.name} (Rating ${s.rating}, SoL ${s.level}, traits: ${s.tags})`
      )
      .join("\n") || "Various harvested souls.";

  const domainSummary =
    (domains || [])
      .slice(0, 2)
      .map(
        (d) =>
          `${d.name} – Tier ${d.tier}, Fear DC ${d.dc}, range ${d.range}, personality: ${d.personality}`
      )
      .join("\n") || "No specific domains.";

  const prompt = `
Design a signature attack ability for this Homie in a One Piece / D&D 5e hybrid game.

Target Homie:
${homieLine}

Concept text from player:
${concept || "(No extra concept given.)"}

Desired power level (1–10): ${power || 7}
Effect tags: ${Array.isArray(types) && types.length ? types.join(", ") : "Any"}

Helpful world context:
Souls:
${soulSummary}

Domains:
${domainSummary}

Write the result as a clear D&D-style ability block (short name, action type, range, target, save/DC, damage dice and rider effects).
`;

  return chat(prompt);
}

async function handleDomainLair(body) {
  const { domain, homies = [], reroll } = body;

  const domainLine = domain
    ? `${domain.name} – Tier ${domain.tier}, Fear DC ${domain.dc}, range ${domain.range}, personality: ${domain.personality}`
    : "Unnamed domain.";

  const homieSummary =
    homies
      .map(
        (h) =>
          `${h.name} – ${h.type}, role ${h.role}, HP ${h.hp}, AC ${h.ac}, attack ${h.attack}`
      )
      .join("\n") || "No specific territory Homies.";

  const prompt = `
Create 3 distinct lair actions for this Soul-Soul Fruit style Domain in a D&D 5e game.

Domain:
${domainLine}

Territory Homies bound to this domain:
${homieSummary}

Each lair action should:
- Be usable as a standard lair action (initiative count 20, losing ties).
- Have a name.
- Have an optional saving throw/DC (or "—").
- Describe the effect in 2–4 sentences, including damage, conditions, difficult terrain, movement, etc.
- Optionally mention how specific Homies interact with it.

Because this is a ${
    reroll ? "reroll / alternate" : "first"
  } set, you can push the creativity a bit.

Return ONLY valid JSON in this exact shape:
{
  "actions": [
    { "name": "...", "dc": "Save text or —", "effect": "Full rules text.", "notes": "Optional extra notes, or empty string." },
    { "name": "...", "dc": "...", "effect": "...", "notes": "..." },
    { "name": "...", "dc": "...", "effect": "...", "notes": "..." }
  ]
}
No markdown, no extra commentary.
`;

  const raw = await chat(prompt);

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.actions || !Array.isArray(parsed.actions)) {
      throw new Error("Missing actions array");
    }
    return parsed.actions;
  } catch (err) {
    console.error("Failed to parse domain lair JSON from model:", err, raw);
    // Fallback: treat whole text as one action
    return [
      {
        name: "Lair Action",
        dc: "",
        effect: raw,
        notes: "Model did not return structured JSON; kept raw text.",
      },
    ];
  }
}

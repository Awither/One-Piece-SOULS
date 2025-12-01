// /api/generate-soul-abilities.js
// Vercel serverless function for Soul-Soul AI helpers

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "OPENAI_API_KEY is not set in environment"
    });
  }

  let body;
  try {
    body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON body"
    });
  }

  const mode = body.mode;
  if (!mode) {
    return res.status(400).json({
      success: false,
      error: "Missing 'mode' in request body"
    });
  }

  try {
    switch (mode) {
      case "abilityCard":
        return await handleAbilityCard(body, res);
      case "domainLairs":
        return await handleDomainLairs(body, res);

      // Backward-compatible modes if you ever still call them:
      case "genericAbility":
        return await handleLegacyGenericAbility(body, res);
      case "homieAttack":
        return await handleLegacyHomieAttack(body, res);

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown mode '${mode}'`
        });
    }
  } catch (err) {
    console.error("AI endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "AI generation failed on server"
    });
  }
}

/* ------------------------------------------
   HELPERS
------------------------------------------ */

// Common chat call – high quality (your “4o-large”)
async function runChat(systemPrompt, userPrompt) {
  const completion = await client.chat.completions.create({
    model: "gpt-4.1", // maximum quality tier
    temperature: 0.85,
    max_tokens: 900,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const msg = completion.choices?.[0]?.message?.content || "";
  return msg.trim();
}

/* ------------------------------------------
   MODE: abilityCard
   Called from the Abilities tab (AI generator)
------------------------------------------ */

async function handleAbilityCard(body, res) {
  const concept = (body.concept || "").trim();
  const power = body.power ?? 7;
  const role = body.role || "Offense";

  const souls = Array.isArray(body.souls) ? body.souls : [];
  const homies = Array.isArray(body.homies) ? body.homies : [];
  const domains = Array.isArray(body.domains) ? body.domains : [];

  if (!concept) {
    return res.status(400).json({
      success: false,
      error: "Missing 'concept' for abilityCard mode"
    });
  }

  const systemPrompt = `
You are an expert One Piece + D&D 5e designer, focused on the Soul-Soul Fruit.
Your job is to forge powerful but DM-usable ability cards.

Return the ability as **plain text**, clearly labeled fields so the frontend
can parse them into a card. Use this exact shape:

Name: <short ability name>
Power: <1-10>
Role: <Offense/Defense/Support/Control/Utility/Reality-Bending/etc>

Action: <what kind of action is required>
Range: <range>
Target: <target shape>
Save/DC: <ability + DC if relevant, or "None">
Damage: <damage dice and type(s) if any>

Description: <ONE sentence short summary optimized for quick reading at table>

Effect:
<full detailed effect, including on hit / on fail, conditions, duration, etc.>

Combo:
<how this interacts with homies, domains, souls, or other abilities. If nothing special, say "None.">
`.trim();

  const contextLines = [];

  if (souls.length) {
    contextLines.push(
      `Souls available (${souls.length}): ` +
        souls
          .map((s) => `${s.name || "??"} [SoL ${s.level}, ${s.spu} SPU]`)
          .join("; ")
    );
  }
  if (homies.length) {
    contextLines.push(
      `Homies (${homies.length}): ` +
        homies
          .map(
            (h) =>
              `${h.name || "??"} [${h.type || "Homie"}, HP ${h.hp || "?"}, AC ${
                h.ac || "?"
              }]`
          )
          .join("; ")
    );
  }
  if (domains.length) {
    contextLines.push(
      `Domains (${domains.length}): ` +
        domains
          .map(
            (d) => `${d.name || "??"} [Tier ${d.tier || "?"}, DC ${d.dc || "?"}]`
          )
          .join("; ")
    );
  }

  const userPrompt = `
Forge a new Soul-Soul Fruit ability card.

Concept:
${concept}

Intended role: ${role}
Desired power level (1–10): ${power}

Current ecosystem context:
${contextLines.join("\n") || "None (standalone ability is fine)."}

Remember: follow the exact labeled format, no extra commentary.
`.trim();

  const text = await runChat(systemPrompt, userPrompt);

  // Grab a name line if possible
  const nameMatch = text.match(/Name\s*:\s*([^\n]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : "AI-Generated Ability";

  return res.status(200).json({
    success: true,
    name,
    text
  });
}

/* ------------------------------------------
   MODE: domainLairs
   Called from Domains tab (AI lair generator)
------------------------------------------ */

async function handleDomainLairs(body, res) {
  const domain = body.domain || {};
  const power = body.power ?? 10;
  const count = Math.min(Math.max(parseInt(body.count || 3, 10), 1), 5);
  const extra = (body.extra || "").trim();

  if (!domain || !domain.name) {
    return res.status(400).json({
      success: false,
      error: "Missing domain.name for domainLairs mode"
    });
  }

  const systemPrompt = `
You are an expert D&D 5e designer and worldbuilder.
You design lair actions for Soul-Soul Fruit domains (Big Mom style).

Return **plain text**, with EACH lair action using this exact mini-card format:

Name: <short lair action name>
Power: <1-10>

Action: Lair Action
Range: <range>
Target: <target shape>
Save/DC: <save type and DC if any, or "None">
Damage: <damage dice and type(s) if any>

Description: <ONE sentence short summary optimized for quick reading at the table>

Effect:
<Full detailed effect text including on fail/save, conditions, terrain changes, etc.>

(Then a blank line and the next "Name:" block.)

Do NOT add bullet points or extra commentary outside these labeled fields.
`.trim();

  const userPrompt = `
Create ${count} lair actions for this soul-infused domain.

Domain:
Name: ${domain.name}
Tier: ${domain.tier ?? "?"}
SPU Invested: ${domain.spu ?? "?"}
Fear DC: ${domain.dc ?? "?"}
Range / size: ${domain.range || "Unknown"}
Personality: ${domain.personality || "None given"}

Extra notes / requested themes:
${extra || "None."}

Each lair action must feel distinct, very powerful, and heavily flavored by this domain.
Remember to follow the exact "Name: ... Power: ... Action: ... Effect: ..." format.
`.trim();

  const text = await runChat(systemPrompt, userPrompt);

  // Let frontend parse into cards using "Name:" splits.
  return res.status(200).json({
    success: true,
    text
  });
}

/* ------------------------------------------
   LEGACY: genericAbility / homieAttack
   (kept so old frontends won't explode)
------------------------------------------ */

async function handleLegacyGenericAbility(body, res) {
  const name = (body.name || "").trim() || "Soul Ability";
  const power = body.power ?? 7;
  const soulCost = body.soulCost ?? null;
  const target = body.target || "";
  const action = body.action || "";
  const range = body.range || "";
  const tgtinfo = body.tgtinfo || "";
  const dc = body.dc || "";
  const dmg = body.dmg || "";
  const effectNotes = body.effectNotes || "";
  const outcomeNotes = body.outcomeNotes || "";
  const mechNotes = body.mechNotes || "";
  const comboNotes = body.comboNotes || "";

  const systemPrompt = `
You are a D&D 5e and One Piece hybrid designer.
You write powerful but playable Soul-Soul Fruit abilities.
Return clear, formatted text for a single ability (no extra commentary).
`.trim();

  const userPrompt = `
Forge a Soul-Soul Fruit ability.

Name: ${name}
Power: ${power}
Soul Cost: ${soulCost ?? "N/A"}
Action: ${action}
Range: ${range}
Target: ${target}
Target Info: ${tgtinfo}
Save/DC: ${dc}
Damage: ${dmg}

Effect notes:
${effectNotes}

Outcome notes:
${outcomeNotes}

Mechanical notes:
${mechNotes}

Combos / Synergies:
${comboNotes}

Return a formatted ability writeup suitable for a stat block.
`.trim();

  const text = await runChat(systemPrompt, userPrompt);

  return res.status(200).json({
    success: true,
    name,
    text
  });
}

async function handleLegacyHomieAttack(body, res) {
  const targetHomieId = body.targetHomieId;
  const concept = (body.concept || "").trim();
  const power = body.power ?? 7;
  const types = Array.isArray(body.types) ? body.types : [];
  const homies = Array.isArray(body.homies) ? body.homies : [];
  const souls = Array.isArray(body.souls) ? body.souls : [];
  const domains = Array.isArray(body.domains) ? body.domains : [];

  const homie = homies.find((h) => h.id === targetHomieId);

  if (!homie || !concept) {
    return res.status(400).json({
      success: false,
      error: "Missing homie or concept for homieAttack"
    });
  }

  const systemPrompt = `
You are designing a signature attack for a Soul-Soul Homie in a One Piece + D&D 5e hybrid game.
Return a single, powerful but usable attack description.
`.trim();

  const contextLines = [];

  contextLines.push(
    `Homie: ${homie.name || "Unnamed"} [type: ${
      homie.type || "Homie"
    }, HP ${homie.hp || "?"}, AC ${homie.ac || "?"}]`
  );

  if (homie.role) contextLines.push(`Role: ${homie.role}`);
  if (homie.personality)
    contextLines.push(`Personality: ${homie.personality}`);
  if (homie.attack)
    contextLines.push(`Base attack: ${homie.attack}`);
  if (homie.location)
    contextLines.push(`Location / bound area: ${homie.location}`);

  if (souls.length) {
    contextLines.push(
      `Relevant souls nearby: ` +
        souls
          .map((s) => `${s.name || "??"} [SoL ${s.level}]`)
          .join("; ")
    );
  }

  if (domains.length) {
    contextLines.push(
      `Domains in play: ` +
        domains
          .map((d) => `${d.name || "??"} [Tier ${d.tier || "?"}]`)
          .join("; ")
    );
  }

  const userPrompt = `
Design a signature Soul-Soul Homie attack.

Concept:
${concept}

Desired power level (1–10): ${power}
Attack tags / effect types: ${types.join(", ") || "unspecified"}

Context:
${contextLines.join("\n")}

Return a single formatted attack writeup (name, action type, range, saving throw, damage, and effect).
`.trim();

  const text = await runChat(systemPrompt, userPrompt);

  return res.status(200).json({
    success: true,
    text
  });
}

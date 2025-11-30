/**
 * Vercel Serverless Function
 * AI Generator for:
 *  - Homie Attacks
 *  - Generic Soul-Fruit Abilities
 *
 * IMPORTANT:
 *  - Requires environment variable: OPENAI_API_KEY
 *  - Must live at: /api/generate-soul-abilities.js
 *  - No custom runtime config needed
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed"
      });
    }

    // ------------------------------
    // Check API Key
    // ------------------------------
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OPENAI_API_KEY is missing on Vercel."
      });
    }

    const client = new OpenAI({ apiKey });

    // ------------------------------
    // Parse Request Body
    // ------------------------------
    let body = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        error: "No JSON body found in the request."
      });
    }

    // Vercel sometimes hands JSON as string → parse manually if needed
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON format."
        });
      }
    }

    const { mode } = body;

    if (!mode) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: mode"
      });
    }

    // ------------------------------
    // Build Prompt
    // ------------------------------

    let systemPrompt = `
You are the Soul-Soul Fruit AI, an expert in D&D abilities, One-Piece logic, and high-quality mechanical design.
Write clean, readable, powerful abilities with correct mechanical text.
Avoid fluff. Provide structured results and damage / DC suggestions.
`;

    let userPrompt = "";

    switch (mode) {
      case "homieAttack": {
        const { targetHomieId, concept, power, types, homies, souls, domains } = body;

        const homie = homies.find(h => h.id === targetHomieId);

        if (!homie) {
          return res.status(400).json({
            success: false,
            error: "Homie not found in payload."
          });
        }

        userPrompt = `
Create a SOUL-SOUL FRUIT themed Homie Attack.

Homie:
${JSON.stringify(homie, null, 2)}

Concept description:
${concept}

Desired Effect Types:
${types.join(", ")}

Power Level (1–10): ${power}

Context:
Souls available = ${souls.length}
Domains = ${domains.length}

Write a complete readable ability:
- Name
- Action type
- Range
- Hit/save mechanics
- Damage (scale to power level)
- Effects / conditions
- Scaling text
- Personality flavor based on homie type
        `;
        break;
      }

      case "genericAbility": {
        const {
          name, target, action, range, tgtinfo, dc, dmg,
          power, soulCost,
          types, outcomes,
          effectNotes, outcomeNotes, mechNotes, comboNotes,
          souls, homies, domains
        } = body;

        userPrompt = `
Forge a new Soul-Fruit Ability.

Base Name: ${name || "(AI chooses)"}
Assigned To: ${target}
Action Type: ${action}
Range: ${range}
Target Info: ${tgtinfo}
Save / DC: ${dc}
Damage: ${dmg}

Power Level: ${power}
Optional Soul Cost: ${soulCost}

Effect Types: ${types.join(", ")}
Outcomes Desired: ${outcomes.join(", ")}

Additional Effect Notes:
${effectNotes}

Outcome Notes:
${outcomeNotes}

Mechanical Notes:
${mechNotes}

Combo / Interaction Notes:
${comboNotes}

Context:
Total Souls: ${souls.length}
Homies: ${homies.length}
Domains: ${domains.length}

Write the full final ability card:
- Ability Name
- Action, Range, Target
- Damage Dice
- Save / DC
- Mechanical Effect
- Outcome Effect
- Combo Synergy
- Scaling or Advancement text
        `;
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown mode: ${mode}`
        });
    }

    // ------------------------------
    // EXECUTE COMPLETION
    // ------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    let text = completion.choices?.[0]?.message?.content || "";

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "No text returned from OpenAI."
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      text
    });

  } catch (err) {
    console.error("FATAL AI ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server crashed inside the AI function: " + err.message
    });
  }
}

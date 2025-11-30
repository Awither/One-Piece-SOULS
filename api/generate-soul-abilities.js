import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Missing OPENAI_API_KEY" });
    }

    const client = new OpenAI({ apiKey });

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, error: "Invalid JSON" });
      }
    }

    const { mode } = body;
    if (!mode) {
      return res.status(400).json({ success: false, error: "Missing mode." });
    }

    /* -------------------------------------------------------------
       BUILD PROMPT BASED ON MODE
    ------------------------------------------------------------- */
    let prompt = "";

    /* -------------------------------------------
       MODE 1 — GENERIC ABILITY
    ------------------------------------------- */
    if (mode === "genericAbility") {
      const { prompt: userPrompt, role, power, souls, homies, domains } = body;

      prompt = `
You are forging a SOUL-SOUL Fruit Ability inspired by Big Mom (One Piece) scaled for D&D.

User Concept:
"${userPrompt}"

Role: ${role}
Power Level: ${power}

Use the flavor of these Souls, Homies, and Domains:

Souls:
${JSON.stringify(souls || [], null, 2)}

Homies:
${JSON.stringify(homies || [], null, 2)}

Domains:
${JSON.stringify(domains || [], null, 2)}

FORMAT EXACTLY LIKE THIS:

Name: <ability name>
Description: <flavorful text>
Action: <action type>
Range: <range>
Target: <target>
Save: <save type>
DC: <number>
Damage: <damage dice>
Effect: <mechanical rules>
Combo: <synergy notes>
      `;
    }

    /* -------------------------------------------
       MODE 2 — DOMAIN LAIR ACTIONS
    ------------------------------------------- */
    else if (mode === "domainLair") {
      const { domain, power, count } = body;

      prompt = `
Create ${count} powerful LAIR ACTIONS for this Soul-Fruit Domain:

${JSON.stringify(domain, null, 2)}

Power Level: ${power}

Use Big Mom Totto Land logic, elemental souls, homie synergy, and environmental manipulation.

FORMAT EACH AS A SINGLE PARAGRAPH LIKE:

Name: <lair action name>
Description: <flavor>
Effect: <mechanical effect>
      `;
    }

    /* -------------------------------------------
       MODE 3 — HOMIE ATTACK
    ------------------------------------------- */
    else if (mode === "homieAttack") {
      const { homie, concept, power, souls, domains } = body;

      prompt = `
Forge a NEW ATTACK for this Homie (One Piece Big Mom soul logic):

Homie:
${JSON.stringify(homie, null, 2)}

Concept:
"${concept}"

Power Level: ${power}

Relevant Souls:
${JSON.stringify(souls || [], null, 2)}

Domains:
${JSON.stringify(domains || [], null, 2)}

FORMAT EXACTLY LIKE:

Name: <attack name>
Description: <flavor>
Action: <action type>
Range: <range>
Target: <target>
Save: <save>
DC: <number>
Damage: <dice>
Effect: <mechanical rules>
Combo: <synergy>
      `;
    }

    else {
      return res.status(400).json({ success: false, error: "Unknown mode." });
    }

    /* -------------------------------------------------------------
       CALL GPT-4.1 (GPT-4o-Large)
    ------------------------------------------------------------- */
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",     // 🟣 GPT-4o-Large (maximum quality)
      temperature: 0.85,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert D&D homebrew designer, One Piece combat analyst, and high-end ability crafter. Always follow the requested format exactly."
        },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("AI returned empty result.");

    return res.status(200).json({ success: true, text });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Server error."
    });
  }
}

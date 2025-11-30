import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, previousCode, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let messages = [];
    // Temperatur extrem niedrig für Editing, damit die KI nicht "halluziniert"
    let temperature = 0.1;

    // === BASIS REGELN ===
    const baseRules = `
CRITICAL TECH SPECS:
- Output ONLY valid HTML/CSS code snippet.
- NO <!DOCTYPE html>, NO <html>, NO <head>, NO <body> tags.
- Background MUST be transparent.
- No <video> tags.
- Use CSS Keyframes for animations.
- Use absolute positioning for layout.
`;

    if (mode === "edit" && previousCode) {
      // === MODUS: INTELLIGENTER EDITOR MIT BEISPIELEN (FEW-SHOT) ===

      messages = [
        {
          role: "system",
          content: `You are a Strict Code Editor Engine.
You receive HTML code and a User Request.
Your job is to REWRITE the code to implement the request.

CRITICAL BEHAVIOR RULES:
1. MINIMAL CHANGES: Do NOT change layout, colors, or animations unless explicitly asked.
2. PRESERVE STRUCTURE: Keep the existing HTML structure and Class names exactly as they are.
3. OUTPUT: Return the FULL valid HTML/CSS snippet with the changes applied.

${baseRules}

### EXAMPLE OF EXPECTED BEHAVIOR ###

[INPUT CODE]
<style>.box { color: red; font-size: 20px; }</style>
<div class="box">Hello World</div>

[USER REQUEST]
"Change the text to 'Bye' and make it blue"

[YOUR OUTPUT]
<style>.box { color: blue; font-size: 20px; }</style>
<div class="box">Bye</div>

###################################
`,
        },
        {
          role: "user",
          content: `
CURRENT CODE:
\`\`\`html
${previousCode}
\`\`\`

USER REQUEST: "${prompt}"

TASK: Apply the change request. Return the FULL updated code block. Do NOT add markdown.`,
        },
      ];
    } else {
      // === MODUS: CREATOR (Neuerstellung) ===
      temperature = 0.7; // Hier darf die KI kreativ sein
      messages = [
        {
          role: "system",
          content: `You are an expert UI/UX Designer for Video Overlays.
Your goal is to create a stunning, modern, animated overlay from scratch.

DESIGN GUIDELINES:
- Modern SaaS aesthetic (clean, glassmorphism, bold typography).
- Elements should fly in, fade in, or pop up.
- Make it look professional.

${baseRules}

DO NOT wrap in markdown code blocks. Just return the raw code string.`,
        },
        { role: "user", content: `Create a marketing overlay for: ${prompt}` },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        temperature: temperature,
        max_tokens: 4000, // Genug Tokens für den vollen Code
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    return new Response(JSON.stringify({ code: generatedCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

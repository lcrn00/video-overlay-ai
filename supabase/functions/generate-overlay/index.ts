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
    let temperature = 0.7;

    // === BASIS REGELN ===
    const techSpecs = `
TECHNICAL SPECS:
- Output ONLY valid HTML/CSS code snippet.
- NO <!DOCTYPE html>, NO <html>, NO <head>, NO <body> tags.
- Background MUST be transparent.
- No <video> tags.
- Use CSS Keyframes for animations.
- Use absolute positioning for layout.
`;

    if (mode === "edit" && previousCode) {
      // === MODUS: UNIFIED DIFF EDITOR (Methode 3) ===
      temperature = 0.0; // WICHTIG: Null Kreativität für präzise Diffs

      messages = [
        {
          role: "system",
          content: `You are a Code Patching Engine.
You do NOT rewrite files. You only output SEARCH/REPLACE blocks to modify existing code.

YOUR FORMAT RULES (Strictly follow this):
1. Identify the EXACT block of code that needs changing.
2. Output a patch in this format:

<<<<<<< SEARCH
[Exact lines from the original code to be replaced]
=======
[New lines to replace the search block]
>>>>>>> REPLACE

3. The "SEARCH" block must match the existing code character-by-character (including whitespace).
4. Include enough context (1-2 lines around the change) in the SEARCH block to ensure uniqueness.
5. If multiple changes are needed, output multiple blocks.
6. Do NOT output the full file. ONLY the blocks.
`,
        },
        {
          role: "user",
          content: `
ORIGINAL CODE:
\`\`\`html
${previousCode}
\`\`\`

USER REQUEST: "${prompt}"

TASK: Generate the SEARCH/REPLACE blocks to apply this change. Be precise.`,
        },
      ];
    } else {
      // === MODUS: CREATOR (Bleibt gleich) ===
      messages = [
        {
          role: "system",
          content: `You are an expert UI/UX Designer for Video Overlays.
Your goal is to create a stunning, modern, animated overlay from scratch.

DESIGN GUIDELINES:
- Modern SaaS aesthetic (clean, glassmorphism, bold typography).
- Elements should fly in, fade in, or pop up.
- Make it look professional.

${techSpecs}

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ code: generatedContent }), {
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

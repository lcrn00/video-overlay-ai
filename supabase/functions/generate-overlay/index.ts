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
    const { prompt, previousCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessage = "";

    // MODUS 1: ÄNDERUNG (Sehr strikt)
    if (previousCode) {
      systemPrompt = `You are a precision code editor engine for HTML/CSS overlays.
Your ONLY job is to modify the existing code based on the user's request.

STRICT EDITING RULES:
1. PRESERVE EVERYTHING that is not explicitly mentioned in the request.
2. DO NOT change positions, colors, sizes, or animations unless asked.
3. If the user asks to change an icon, ONLY change the icon. Keep the old layout.
4. If the user asks to animate differently, ONLY change the CSS keyframes/animation properties.
5. NO <!DOCTYPE html>, NO <html>, NO <head>, NO <body> tags. Just the inner content snippet.
6. RETURN THE FULL UPDATED CODE, not just the diff.

CURRENT CODE CONTEXT:
${previousCode}`;

      userMessage = `CHANGE REQUEST: ${prompt}
      
      Remember: Only touch what I asked for. Keep the rest exactly as is.`;
    }
    // MODUS 2: NEU ERSTELLUNG (Kreativ)
    else {
      systemPrompt = `You are an expert UI/UX Designer for Video Overlays.
Generate a new, transparent HTML/CSS overlay snippet.

RULES:
1. Transparent background.
2. No video tags (video is in background).
3. Modern SaaS design.
4. Absolute positioning.
5. CSS Animations included.
6. NO <!DOCTYPE html> tags. Just the div/style snippet.`;

      userMessage = `Create a marketing overlay for: ${prompt}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: previousCode ? 0.2 : 0.7, // Niedrige Temperatur beim Editieren für Präzision!
        max_tokens: 2000,
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

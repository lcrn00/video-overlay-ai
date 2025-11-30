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

    let messages = [];

    // Base rules for both modes
    const baseRules = `
CRITICAL RULES:
1. BACKGROUND MUST BE TRANSPARENT. Do NOT add a background-color to body or html.
2. Do NOT include a <video> tag. The video is already playing in the background.
3. Return ONLY the inner HTML content (divs, styles, scripts) for the overlay. 
4. NO <!DOCTYPE html>, NO <html>, NO <head>, NO <body> tags. Just the content.
5. Use absolute positioning to place elements (e.g., "bottom-left badge", "center title").
6. Add CSS animations (keyframes) to make elements fade in, slide up, or pulse.
DO NOT wrap in markdown code blocks. Just return the raw code string.`;

    if (previousCode) {
      // MODE 1: STRICT EDITOR
      // We give the AI the old code and tell it to ONLY change what's asked.
      messages = [
        {
          role: "system",
          content: `You are a precision code editor for HTML/CSS overlays. 
Your goal is to MODIFY existing code based on user requests without breaking the existing design or layout unless explicitly asked.

${baseRules}

STRICT EDITING GUIDELINES:
- Only modify the parts of the code relevant to the user's request.
- PRESERVE existing animations, positions, and styles if the user didn't ask to change them.
- If the user asks to change text, only change text.
- If the user asks to change color, only change color.
- Do NOT regenerate the whole layout from scratch. Stick to the provided structure.`,
        },
        {
          role: "user",
          content: `Here is the CURRENT CODE:
\`\`\`html
${previousCode}
\`\`\`

USER REQUEST: "${prompt}"

TASK: Return the UPDATED code. Keep everything else exactly the same.`,
        },
      ];
    } else {
      // MODE 2: CREATOR
      messages = [
        {
          role: "system",
          content: `You are an expert UI/UX Designer for Video Overlays.
Your job is to generate HTML/CSS snippets that will be overlayed ON TOP of a background video.
${baseRules}`,
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
        temperature: previousCode ? 0.2 : 0.7, // Lower temperature for editing to be more precise/less creative
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

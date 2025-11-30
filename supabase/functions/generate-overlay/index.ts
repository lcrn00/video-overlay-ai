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
    const { prompt, previousCode } = await req.json(); // Wir holen uns den alten Code
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let messages = [];

    // Der Basis System-Prompt
    const baseSystemPrompt = `You are an expert UI/UX Designer for Video Overlays.
Your job is to generate HTML/CSS snippets that will be overlayed ON TOP of a background video.

CRITICAL RULES:
1. BACKGROUND MUST BE TRANSPARENT. Do NOT add a background-color to body or html.
2. Do NOT include a <video> tag. The video is already playing in the background.
3. Return ONLY the inner HTML content (divs, styles, scripts) for the overlay. 
4. NO <!DOCTYPE html>, NO <html>, NO <head>, NO <body> tags. Just the content.
5. Use absolute positioning to place elements (e.g., "bottom-left badge", "center title").
6. Add CSS animations (keyframes) to make elements fade in, slide up, or pulse.
DO NOT wrap in markdown code blocks. Just return the raw code string.`;

    if (previousCode) {
      // MODUS: EDITIEREN
      // Wir geben der KI den alten Code und den neuen Wunsch
      messages = [
        { role: "system", content: baseSystemPrompt },
        {
          role: "user",
          content: `I have an existing overlay code. I want you to MODIFY it based on my request.
          
          EXISTING CODE:
          ${previousCode}
          
          MY REQUEST:
          ${prompt}
          
          TASK: Return the UPDATED code. Keep existing styles if I didn't ask to change them. Only output the code.`,
        },
      ];
    } else {
      // MODUS: NEU ERSTELLEN
      messages = [
        { role: "system", content: baseSystemPrompt },
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
        temperature: 0.7,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

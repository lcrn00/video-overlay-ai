import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert HTML/CSS overlay generator for marketing videos. Generate ONLY HTML/CSS overlays (text, widgets, animations) with a transparent background.

CRITICAL REQUIREMENTS:
1. Return a COMPLETE HTML document starting with <!DOCTYPE html>
2. DO NOT include a <video> element - the video is handled separately
3. The body MUST have a transparent background (background: transparent !important)
4. All overlay elements must be positioned to work on top of a video background
5. Use inline styles or <style> tags - no external CSS files
6. Make it responsive and work across devices
7. Add smooth animations using CSS keyframes
8. Keep the code clean and production-ready

STRUCTURE EXAMPLE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Overlay</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100vh; 
      background: transparent !important;
      overflow: hidden;
    }
    /* Your overlay styles here - positioned absolutely or fixed */
  </style>
</head>
<body>
  <!-- Your overlay elements here -->
</body>
</html>

DESIGN GUIDELINES:
- Use modern, professional styling
- Ensure text is readable with proper contrast (use semi-transparent backgrounds if needed)
- Add subtle animations for visual appeal
- Use semantic HTML elements
- Make overlay elements positioned absolutely or fixed
- NEVER add opaque backgrounds that would hide the video

DO NOT include markdown code blocks, DO NOT add explanations, ONLY return the complete HTML document.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    console.log('Generated overlay HTML:', generatedCode.substring(0, 200) + '...');

    return new Response(
      JSON.stringify({ code: generatedCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-overlay function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
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
    const { prompt, videoSrc } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert HTML/CSS video marketing page generator. Generate complete, standalone HTML documents that include a video background with overlays.

CRITICAL REQUIREMENTS:
1. Return a COMPLETE HTML document starting with <!DOCTYPE html>
2. Include a <video> element with src="VIDEO_PLACEHOLDER" that will be replaced
3. The video should be positioned as a background (position: fixed or absolute, covering the viewport)
4. Overlay all marketing elements (text, widgets, animations) ON TOP of the video
5. Use inline styles or <style> tags - no external CSS files
6. Make it responsive and work across devices
7. Add smooth animations using CSS keyframes
8. Keep the code clean and production-ready
9. The video should autoplay, loop, and be muted for web compatibility

STRUCTURE EXAMPLE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Video</title>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100vh; }
    .video-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; }
    /* Your overlay styles here */
  </style>
</head>
<body>
  <video class="video-background" autoplay loop muted playsinline>
    <source src="VIDEO_PLACEHOLDER" type="video/mp4">
  </video>
  <!-- Your overlay elements here -->
</body>
</html>

DESIGN GUIDELINES:
- Use modern, professional styling
- Ensure text is readable with proper contrast (use semi-transparent backgrounds if needed)
- Add subtle animations for visual appeal
- Use semantic HTML elements
- Make overlay elements positioned absolutely or fixed

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
    let generatedCode = data.choices[0].message.content;

    // Replace the placeholder with the actual video source
    if (videoSrc) {
      generatedCode = generatedCode.replace(/VIDEO_PLACEHOLDER/g, videoSrc);
    }

    console.log('Generated HTML code:', generatedCode.substring(0, 200) + '...');

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
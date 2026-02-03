import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileBase64, fileType } = await req.json()
    // Use process.env.API_KEY as per strict guidelines
    const apiKey = process.env.API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API_KEY is not set" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Strict prompt engineering as requested
    const prompt = `
      You are an expert HR Data Extraction AI. 
      Analyze the provided CV/Resume document and extract the following details into a JSON object.
      
      Requirements:
      1. Extract "full_name", "email", "phone".
      2. Extract "skills" as an array of strings.
      3. Extract "education" and "work_history" as summary strings.
      4. CRITICAL: Extract the full home address from the CV text. If the address is not explicitly found, return an empty string (''). Do not hallucinate.
      
      Return ONLY valid JSON.
    `;

    // Using gemini-3-flash-preview which supports multimodal input
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: {
              mimeType: fileType || 'application/pdf',
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    // Ensure we get clean JSON
    const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(
      cleanJson,
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
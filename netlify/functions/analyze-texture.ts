import type { Context } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AnalyzeTextureRequest {
  imageBase64: string;
}

interface AnalyzeTextureResponse {
  success: boolean;
  texturePrompt?: string;
  error?: string;
  processingTimeMs?: number;
}

const TEXTURE_ANALYSIS_PROMPT = `You are an expert archaeologist analyzing an artifact image.
Describe the texture, material, and surface characteristics of this artifact in a single concise sentence (max 100 words).

Focus on:
- Material type (ceramic, stone, bronze, bone, etc.)
- Surface texture (smooth, rough, weathered, polished, etc.)
- Color and patina
- Visible damage or wear patterns
- Any decorative elements

Example outputs:
- "Weathered terracotta pottery with red ochre traces, surface cracks, and mineral deposits"
- "Polished bronze blade with green oxidation patina and fine scratches from use"
- "Rough limestone fragment with traces of ancient plaster and erosion marks"

Respond with ONLY the texture description, no additional text or formatting.`;

export default async function handler(
  req: Request,
  _context: Context
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Google AI API key not configured',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: AnalyzeTextureRequest = await req.json();

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Remove data URL prefix if present
    let imageData = body.imageBase64;
    let mimeType = 'image/jpeg';

    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageData = match[2];
      }
    }

    // Generate content with image
    const result = await model.generateContent([
      TEXTURE_ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const texturePrompt = result.response.text()?.trim();

    if (!texturePrompt) {
      throw new Error('Empty response from Gemini');
    }

    const response: AnalyzeTextureResponse = {
      success: true,
      texturePrompt,
      processingTimeMs: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    const response: AnalyzeTextureResponse = {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

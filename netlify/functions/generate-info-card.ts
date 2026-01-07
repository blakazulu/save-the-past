import type { Context } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ArtifactMetadata {
  name?: string;
  discoveryLocation?: string;
  excavationLayer?: string;
  siteName?: string;
  notes?: string;
  tags?: string[];
}

interface InfoCardRequest {
  imageBase64: string;
  metadata?: Partial<ArtifactMetadata>;
}

interface InfoCardAnalysis {
  material: string;
  estimatedAge: {
    range: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning?: string;
  };
  possibleUse: string;
  culturalContext: string;
  similarArtifacts: string[];
  preservationNotes: string;
  aiModel: string;
  aiConfidence: number;
  isHumanEdited: boolean;
  disclaimer: string;
}

interface InfoCardResponse {
  success: boolean;
  infoCard?: InfoCardAnalysis;
  error?: string;
  processingTimeMs?: number;
}

const ARCHAEOLOGY_ANALYSIS_PROMPT = `You are an expert archaeologist and artifact specialist. Analyze the provided image of an archaeological artifact and provide a detailed analysis.

Context provided by the discoverer:
{{METADATA}}

Based on your analysis of the image and any provided context, generate a JSON response with the following structure:

{
  "material": "Primary material(s) the artifact is made of (e.g., 'Ceramic with traces of red ochre pigment', 'Bronze with copper patina')",
  "estimatedAge": {
    "range": "Estimated age range (e.g., '3500-3000 BCE', 'Late Bronze Age', '2nd-3rd century CE')",
    "confidence": "high" | "medium" | "low",
    "reasoning": "Brief explanation of how you estimated the age based on style, material, construction techniques, etc."
  },
  "possibleUse": "Most likely original purpose or function (e.g., 'Ritual vessel for liquid offerings', 'Agricultural tool for grain harvesting')",
  "culturalContext": "Cultural or historical context (e.g., 'Canaanite period, likely associated with temple worship', 'Roman provincial, common in military settlements')",
  "similarArtifacts": ["List of 2-4 similar known artifacts or types", "Include museum references if applicable"],
  "preservationNotes": "Notes on preservation state and recommendations (e.g., 'Good condition with minor surface erosion. Avoid moisture. Handle with cotton gloves.')",
  "aiConfidence": 0.0-1.0 (overall confidence in the analysis)
}

Important guidelines:
- Be specific but acknowledge uncertainty where appropriate
- If the image is unclear or the artifact is damaged, adjust confidence accordingly
- Consider the provided metadata context when available
- Focus on observable features rather than speculation
- Use academic terminology but keep explanations accessible
- If you cannot determine something with confidence, say so rather than guessing

Respond ONLY with the JSON object, no additional text.`;

function formatMetadata(metadata?: Partial<ArtifactMetadata>): string {
  if (!metadata) {
    return 'No additional context provided.';
  }

  const parts: string[] = [];

  if (metadata.name) {
    parts.push(`Artifact name: ${metadata.name}`);
  }
  if (metadata.siteName) {
    parts.push(`Archaeological site: ${metadata.siteName}`);
  }
  if (metadata.discoveryLocation) {
    parts.push(`Discovery location: ${metadata.discoveryLocation}`);
  }
  if (metadata.excavationLayer) {
    parts.push(`Excavation layer/stratum: ${metadata.excavationLayer}`);
  }
  if (metadata.notes) {
    parts.push(`Field notes: ${metadata.notes}`);
  }
  if (metadata.tags && metadata.tags.length > 0) {
    parts.push(`Tags: ${metadata.tags.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No additional context provided.';
}

function parseAnalysisResponse(responseText: string): InfoCardAnalysis {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();

  // Remove markdown code block if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);

  // Validate and normalize the response
  const analysis: InfoCardAnalysis = {
    material: parsed.material || 'Unknown material',
    estimatedAge: {
      range: parsed.estimatedAge?.range || 'Unknown period',
      confidence: ['high', 'medium', 'low'].includes(parsed.estimatedAge?.confidence)
        ? parsed.estimatedAge.confidence
        : 'low',
      reasoning: parsed.estimatedAge?.reasoning,
    },
    possibleUse: parsed.possibleUse || 'Unknown function',
    culturalContext: parsed.culturalContext || 'Cultural context undetermined',
    similarArtifacts: Array.isArray(parsed.similarArtifacts)
      ? parsed.similarArtifacts.filter((s: unknown) => typeof s === 'string')
      : [],
    preservationNotes: parsed.preservationNotes || 'No specific preservation notes',
    aiModel: 'gemini-2.0-flash-exp',
    aiConfidence: typeof parsed.aiConfidence === 'number'
      ? Math.max(0, Math.min(1, parsed.aiConfidence))
      : 0.5,
    isHumanEdited: false,
    disclaimer:
      'This analysis was generated by AI and should be verified by a qualified archaeologist. AI analysis may contain errors or misidentifications.',
  };

  return analysis;
}

export default async function handler(
  req: Request,
  _context: Context
): Promise<Response> {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    // Check for API key
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

    const body: InfoCardRequest = await req.json();

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Prepare the prompt with metadata context
    const metadataContext = formatMetadata(body.metadata);
    const prompt = ARCHAEOLOGY_ANALYSIS_PROMPT.replace('{{METADATA}}', metadataContext);

    // Remove data URL prefix if present for the image
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
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    // Parse the analysis
    const infoCard = parseAnalysisResponse(responseText);

    const response: InfoCardResponse = {
      success: true,
      infoCard,
      processingTimeMs: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for specific error types
    let userMessage = errorMessage;
    if (errorMessage.includes('SAFETY')) {
      userMessage = 'The image could not be analyzed due to content safety filters.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      userMessage = 'API rate limit reached. Please try again in a few moments.';
    } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
      userMessage = 'Failed to parse AI response. Please try again.';
    }

    const response: InfoCardResponse = {
      success: false,
      error: userMessage,
      processingTimeMs: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

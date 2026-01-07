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

interface LocalizedText {
  en: string;
  he: string;
}

interface InfoCardAnalysis {
  material: LocalizedText;
  estimatedAge: {
    range: LocalizedText;
    confidence: 'high' | 'medium' | 'low';
    reasoning?: LocalizedText;
  };
  possibleUse: LocalizedText;
  culturalContext: LocalizedText;
  similarArtifacts: LocalizedText[];
  preservationNotes: LocalizedText;
  aiModel: string;
  aiConfidence: number;
  isHumanEdited: boolean;
  disclaimer: LocalizedText;
}

interface InfoCardResponse {
  success: boolean;
  infoCard?: InfoCardAnalysis;
  error?: string;
  processingTimeMs?: number;
}

const ARCHAEOLOGY_ANALYSIS_PROMPT = `You are an expert archaeologist and artifact specialist. Analyze the provided image of an archaeological artifact and provide a detailed analysis in BOTH English and Hebrew.

Context provided by the discoverer:
{{METADATA}}

Based on your analysis of the image and any provided context, generate a JSON response with BILINGUAL content (English and Hebrew). Use this exact structure:

{
  "material": {
    "en": "Primary material(s) in English (e.g., 'Ceramic with traces of red ochre pigment')",
    "he": "החומר העיקרי בעברית (לדוגמה: 'קרמיקה עם עקבות פיגמנט אוכרה אדום')"
  },
  "estimatedAge": {
    "range": {
      "en": "Estimated age range in English (e.g., '3500-3000 BCE', 'Late Bronze Age')",
      "he": "טווח גיל משוער בעברית (לדוגמה: '3500-3000 לפנה״ס', 'תקופת הברונזה המאוחרת')"
    },
    "confidence": "high" | "medium" | "low",
    "reasoning": {
      "en": "Brief explanation in English",
      "he": "הסבר קצר בעברית"
    }
  },
  "possibleUse": {
    "en": "Most likely original purpose in English",
    "he": "השימוש המקורי הסביר ביותר בעברית"
  },
  "culturalContext": {
    "en": "Cultural or historical context in English",
    "he": "הקשר תרבותי או היסטורי בעברית"
  },
  "similarArtifacts": [
    {"en": "Similar artifact 1 in English", "he": "ממצא דומה 1 בעברית"},
    {"en": "Similar artifact 2 in English", "he": "ממצא דומה 2 בעברית"}
  ],
  "preservationNotes": {
    "en": "Preservation notes in English",
    "he": "הערות שימור בעברית"
  },
  "aiConfidence": 0.0-1.0
}

Important guidelines:
- Provide ALL text fields in BOTH English AND Hebrew
- Hebrew text should be natural, academic Hebrew (not machine translation)
- Be specific but acknowledge uncertainty where appropriate
- Use academic terminology but keep explanations accessible
- If you cannot determine something with confidence, say so in both languages

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

function ensureLocalized(value: unknown, fallbackEn: string, fallbackHe: string): LocalizedText {
  if (value && typeof value === 'object' && 'en' in value && 'he' in value) {
    return {
      en: String((value as Record<string, unknown>).en) || fallbackEn,
      he: String((value as Record<string, unknown>).he) || fallbackHe,
    };
  }
  // If it's a plain string (old format), use it for English and provide Hebrew fallback
  if (typeof value === 'string') {
    return { en: value, he: fallbackHe };
  }
  return { en: fallbackEn, he: fallbackHe };
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

  // Validate and normalize the response with bilingual support
  const analysis: InfoCardAnalysis = {
    material: ensureLocalized(parsed.material, 'Unknown material', 'חומר לא ידוע'),
    estimatedAge: {
      range: ensureLocalized(
        parsed.estimatedAge?.range,
        'Unknown period',
        'תקופה לא ידועה'
      ),
      confidence: ['high', 'medium', 'low'].includes(parsed.estimatedAge?.confidence)
        ? parsed.estimatedAge.confidence
        : 'low',
      reasoning: parsed.estimatedAge?.reasoning
        ? ensureLocalized(parsed.estimatedAge.reasoning, '', '')
        : undefined,
    },
    possibleUse: ensureLocalized(parsed.possibleUse, 'Unknown function', 'שימוש לא ידוע'),
    culturalContext: ensureLocalized(
      parsed.culturalContext,
      'Cultural context undetermined',
      'הקשר תרבותי לא נקבע'
    ),
    similarArtifacts: Array.isArray(parsed.similarArtifacts)
      ? parsed.similarArtifacts.map((item: unknown) => {
          if (typeof item === 'string') {
            return { en: item, he: item };
          }
          if (item && typeof item === 'object' && 'en' in item && 'he' in item) {
            return {
              en: String((item as Record<string, unknown>).en),
              he: String((item as Record<string, unknown>).he),
            };
          }
          return { en: 'Unknown artifact', he: 'ממצא לא ידוע' };
        })
      : [],
    preservationNotes: ensureLocalized(
      parsed.preservationNotes,
      'No specific preservation notes',
      'אין הערות שימור ספציפיות'
    ),
    aiModel: 'gemini-2.0-flash-exp',
    aiConfidence: typeof parsed.aiConfidence === 'number'
      ? Math.max(0, Math.min(1, parsed.aiConfidence))
      : 0.5,
    isHumanEdited: false,
    disclaimer: {
      en: 'This analysis was generated by AI and should be verified by a qualified archaeologist. AI analysis may contain errors or misidentifications.',
      he: 'ניתוח זה נוצר על ידי בינה מלאכותית ויש לאמתו על ידי ארכיאולוג מוסמך. ניתוח AI עלול להכיל שגיאות או זיהויים שגויים.',
    },
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

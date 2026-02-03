/**
 * Centralized AI model configuration
 * Single source of truth for AI model identifiers
 */

export const AI_MODELS = {
  /**
   * Google Gemini 2.5 Flash - Fast multimodal model
   * Used for: Info card generation with vision + text
   */
  GEMINI_INFO_CARD: 'gemini-2.5-flash',

  /**
   * Google Gemini 2.5 Flash - Vision model
   * Used for: Image analysis and artifact identification
   */
  GEMINI_VISION: 'gemini-2.5-flash',
} as const;

/**
 * Model configuration metadata
 */
export const MODEL_METADATA = {
  [AI_MODELS.GEMINI_INFO_CARD]: {
    provider: 'Google',
    capabilities: ['vision', 'text', 'json'],
    inputLimit: 1048576, // 1M tokens
    outputLimit: 65536,  // 65K tokens
  },
} as const;

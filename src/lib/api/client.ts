const API_BASE = '/.netlify/functions';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// 3D Reconstruction API
export interface ReconstructRequest {
  imageBase64: string;
  method?: 'stable-fast-3d' | 'instant-mesh';
  removeBackground?: boolean;
}

export interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'stable-fast-3d' | 'instant-mesh';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

export async function reconstruct3D(
  req: ReconstructRequest
): Promise<ApiResponse<ReconstructResponse>> {
  return apiRequest<ReconstructResponse>('/reconstruct-3d', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// Info Card Generation API
export interface InfoCardRequest {
  imageBase64: string;
  metadata?: {
    name?: string;
    discoveryLocation?: string;
    excavationLayer?: string;
    siteName?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface InfoCardAnalysis {
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

export interface InfoCardGenerationResponse {
  success: boolean;
  infoCard?: InfoCardAnalysis;
  error?: string;
  processingTimeMs?: number;
}

export async function generateInfoCard(
  req: InfoCardRequest
): Promise<ApiResponse<InfoCardGenerationResponse>> {
  return apiRequest<InfoCardGenerationResponse>('/generate-info-card', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// Utility to convert Blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility to convert base64 to Blob
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

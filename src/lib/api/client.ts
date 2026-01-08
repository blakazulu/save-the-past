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

// 3D Reconstruction API - Start Task
export interface ReconstructRequest {
  imageBase64: string;
  removeBackground?: boolean;
}

export interface ReconstructStartResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

export async function startReconstruct3D(
  req: ReconstructRequest
): Promise<ApiResponse<ReconstructStartResponse>> {
  return apiRequest<ReconstructStartResponse>('/reconstruct-3d', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// 3D Reconstruction API - Check Status
export interface ReconstructStatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  modelBase64?: string;
  format?: 'glb';
  error?: string;
}

export async function checkReconstruct3DStatus(
  taskId: string
): Promise<ApiResponse<ReconstructStatusResponse>> {
  return apiRequest<ReconstructStatusResponse>(`/reconstruct-3d-status?taskId=${taskId}`, {
    method: 'GET',
  });
}

// Polling helper for 3D reconstruction
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes

export interface ReconstructResult {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  error?: string;
}

export async function reconstruct3D(
  req: ReconstructRequest,
  onProgress?: (progress: number, status: string) => void
): Promise<ReconstructResult> {
  // Step 1: Start the task
  const startResult = await startReconstruct3D(req);

  if (!startResult.success || !startResult.data?.taskId) {
    return {
      success: false,
      error: startResult.error || startResult.data?.error || 'Failed to start reconstruction',
    };
  }

  const taskId = startResult.data.taskId;
  const startTime = Date.now();

  // Step 2: Poll for completion
  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    const statusResult = await checkReconstruct3DStatus(taskId);

    if (!statusResult.success) {
      return {
        success: false,
        error: statusResult.error || 'Failed to check status',
      };
    }

    const status = statusResult.data!;

    // Report progress
    if (onProgress) {
      onProgress(status.progress, status.status);
    }

    // Check if completed
    if (status.status === 'succeeded') {
      return {
        success: true,
        modelBase64: status.modelBase64,
        format: status.format,
      };
    }

    // Check if failed
    if (status.status === 'failed') {
      return {
        success: false,
        error: status.error || 'Reconstruction failed',
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    success: false,
    error: 'Reconstruction timed out after 5 minutes',
  };
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

export interface LocalizedText {
  en: string;
  he: string;
}

export interface InfoCardAnalysis {
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

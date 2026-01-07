import type { Context } from '@netlify/functions';
import { Client } from '@gradio/client';

interface ReconstructRequest {
  imageBase64: string;
  method?: 'stable-fast-3d' | 'hunyuan3d';
  removeBackground?: boolean;
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'stable-fast-3d' | 'hunyuan3d';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

// Updated to use working HuggingFace Spaces
const STABLE_FAST_3D_SPACE = 'stabilityai/stable-fast-3d';
const HUNYUAN3D_SPACE = 'tencent/Hunyuan3D-2';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function base64ToBlob(base64: string): Promise<Blob> {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/png' });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to extract URL from various Gradio response formats
function extractUrl(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    // Try common Gradio response properties
    if (obj.url && typeof obj.url === 'string') return obj.url;
    if (obj.path && typeof obj.path === 'string') return obj.path;
    if (obj.value && typeof obj.value === 'string') return obj.value;
    if (obj.value && typeof obj.value === 'object') {
      const val = obj.value as Record<string, unknown>;
      if (val.url && typeof val.url === 'string') return val.url;
      if (val.path && typeof val.path === 'string') return val.path;
    }
    // Check for nested data property
    if (obj.data && typeof obj.data === 'string') return obj.data;
  }
  return null;
}

async function reconstructWithStableFast3D(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'stable-fast-3d' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(STABLE_FAST_3D_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // Stable Fast 3D API: /run_button endpoint
  const result = await client.predict('/run_button', {
    input_image: imageBlob,
    foreground_ratio: 0.85,
    remesh_option: 'None',
    vertex_count: -1,
    texture_size: 1024,
  });

  const data = result.data as unknown[];

  // The 3D model is the second item (index 1)
  let glbUrl: string | null = null;
  if (data.length > 1) {
    glbUrl = extractUrl(data[1]);
  }

  // If not found at index 1, try other indices
  if (!glbUrl) {
    for (let i = 0; i < data.length; i++) {
      const url = extractUrl(data[i]);
      if (url && (url.endsWith('.glb') || url.endsWith('.gltf') || url.includes('file='))) {
        glbUrl = url;
        break;
      }
    }
  }

  if (!glbUrl) {
    throw new Error(`No GLB from Stable Fast 3D. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const glbResponse = await fetch(glbUrl);
  if (!glbResponse.ok) {
    throw new Error(`Failed to fetch GLB from Stable Fast 3D: ${glbResponse.status}`);
  }

  const modelBlob = await glbResponse.blob();
  return { modelBlob, method: 'stable-fast-3d' };
}

async function reconstructWithHunyuan3D(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'hunyuan3d' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(HUNYUAN3D_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // Hunyuan3D API: /shape_generation endpoint
  const result = await client.predict('/shape_generation', {
    image: imageBlob,
    check_box_rembg: removeBackground,
    steps: 30,
    guidance_scale: 5.0,
    seed: 1234,
    octree_resolution: 256,
    num_chunks: 8000,
    randomize_seed: true,
  });

  const data = result.data as unknown[];

  // The 3D model is the first item
  let modelUrl: string | null = null;
  if (data.length > 0) {
    modelUrl = extractUrl(data[0]);
  }

  // If not found at index 0, try other indices
  if (!modelUrl) {
    for (let i = 0; i < data.length; i++) {
      const url = extractUrl(data[i]);
      if (url && (url.endsWith('.glb') || url.endsWith('.obj') || url.endsWith('.ply') || url.includes('file='))) {
        modelUrl = url;
        break;
      }
    }
  }

  if (!modelUrl) {
    throw new Error(`No 3D model from Hunyuan3D. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const modelResponse = await fetch(modelUrl);
  if (!modelResponse.ok) {
    throw new Error(`Failed to fetch model from Hunyuan3D: ${modelResponse.status}`);
  }

  const modelBlob = await modelResponse.blob();
  return { modelBlob, method: 'hunyuan3d' };
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
  let retryCount = 0;

  try {
    const body: ReconstructRequest = await req.json();

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const imageBlob = await base64ToBlob(body.imageBase64);
    const preferredMethod = body.method || 'stable-fast-3d';
    const removeBackground = body.removeBackground ?? true;

    let modelBlob: Blob | null = null;
    let usedMethod: 'stable-fast-3d' | 'hunyuan3d' = preferredMethod;
    let lastError: Error | null = null;

    // Try preferred method first with retries
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (preferredMethod === 'stable-fast-3d') {
          const result = await reconstructWithStableFast3D(imageBlob, removeBackground);
          modelBlob = result.modelBlob;
          usedMethod = result.method;
        } else {
          const result = await reconstructWithHunyuan3D(imageBlob, removeBackground);
          modelBlob = result.modelBlob;
          usedMethod = result.method;
        }
        break;
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt + 1;

        // Check for rate limiting
        if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }

        // For other errors, try fallback method immediately
        break;
      }
    }

    // If primary method failed, try fallback
    if (!modelBlob && preferredMethod === 'stable-fast-3d') {
      try {
        const result = await reconstructWithHunyuan3D(imageBlob, removeBackground);
        modelBlob = result.modelBlob;
        usedMethod = result.method;
        lastError = null;
      } catch (error) {
        lastError = error as Error;
      }
    } else if (!modelBlob && preferredMethod === 'hunyuan3d') {
      try {
        const result = await reconstructWithStableFast3D(imageBlob, removeBackground);
        modelBlob = result.modelBlob;
        usedMethod = result.method;
        lastError = null;
      } catch (error) {
        lastError = error as Error;
      }
    }

    if (!modelBlob) {
      throw lastError || new Error('All reconstruction methods failed');
    }

    // Convert model to base64
    const modelBase64 = await blobToBase64(modelBlob);

    const response: ReconstructResponse = {
      success: true,
      modelBase64,
      format: 'glb',
      method: usedMethod,
      processingTimeMs: Date.now() - startTime,
      retryCount,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    const response: ReconstructResponse = {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
      retryCount,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

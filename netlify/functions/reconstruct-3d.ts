import type { Context } from '@netlify/functions';
import { Client } from '@gradio/client';

interface ReconstructRequest {
  imageBase64: string;
  method?: 'stable-fast-3d' | 'instant-mesh';
  removeBackground?: boolean;
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'stable-fast-3d' | 'instant-mesh';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

// Updated to use working HuggingFace Spaces
const STABLE_FAST_3D_SPACE = 'stabilityai/stable-fast-3d';
const INSTANT_MESH_SPACE = 'TencentARC/InstantMesh';

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

async function reconstructWithStableFast3D(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'stable-fast-3d' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(STABLE_FAST_3D_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // Stable Fast 3D - try with image input
  const result = await client.predict('/run', [
    imageBlob,           // input image
    removeBackground,    // remove background
    0.85,               // foreground ratio
    'none',             // remesh option
    1024,               // texture size
  ]);

  const data = result.data as (string | { url?: string; path?: string })[];

  // Find the GLB file in the response
  let glbUrl: string | null = null;
  for (const item of data) {
    if (typeof item === 'string' && item.endsWith('.glb')) {
      glbUrl = item;
      break;
    } else if (item && typeof item === 'object' && (item.url || item.path)) {
      const url = item.url || item.path;
      if (url) {
        glbUrl = url;
        break;
      }
    }
  }

  if (!glbUrl) {
    throw new Error('No GLB model returned from Stable Fast 3D');
  }

  const glbResponse = await fetch(glbUrl);
  if (!glbResponse.ok) {
    throw new Error(`Failed to fetch GLB from Stable Fast 3D: ${glbResponse.status}`);
  }

  const modelBlob = await glbResponse.blob();
  return { modelBlob, method: 'stable-fast-3d' };
}

async function reconstructWithInstantMesh(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'instant-mesh' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(INSTANT_MESH_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // InstantMesh - try with image input
  const result = await client.predict('/run', [
    imageBlob,           // input image
    removeBackground,    // remove background
  ]);

  const data = result.data as (string | { url?: string; path?: string })[];

  // Find the GLB/OBJ file in the response
  let modelUrl: string | null = null;
  for (const item of data) {
    if (typeof item === 'string' && (item.endsWith('.glb') || item.endsWith('.obj'))) {
      modelUrl = item;
      break;
    } else if (item && typeof item === 'object' && (item.url || item.path)) {
      const url = item.url || item.path;
      if (url) {
        modelUrl = url;
        break;
      }
    }
  }

  if (!modelUrl) {
    throw new Error('No 3D model returned from InstantMesh');
  }

  const modelResponse = await fetch(modelUrl);
  if (!modelResponse.ok) {
    throw new Error(`Failed to fetch model from InstantMesh: ${modelResponse.status}`);
  }

  const modelBlob = await modelResponse.blob();
  return { modelBlob, method: 'instant-mesh' };
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
    let usedMethod: 'stable-fast-3d' | 'instant-mesh' = preferredMethod;
    let lastError: Error | null = null;

    // Try preferred method first with retries
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (preferredMethod === 'stable-fast-3d') {
          const result = await reconstructWithStableFast3D(imageBlob, removeBackground);
          modelBlob = result.modelBlob;
          usedMethod = result.method;
        } else {
          const result = await reconstructWithInstantMesh(imageBlob, removeBackground);
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
        const result = await reconstructWithInstantMesh(imageBlob, removeBackground);
        modelBlob = result.modelBlob;
        usedMethod = result.method;
        lastError = null;
      } catch (error) {
        lastError = error as Error;
      }
    } else if (!modelBlob && preferredMethod === 'instant-mesh') {
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

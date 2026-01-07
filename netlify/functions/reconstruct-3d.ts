import type { Context, Config } from '@netlify/functions';
import { Client } from '@gradio/client';

// Set longer timeout for 3D reconstruction (can take 60+ seconds)
export const config: Config = {
  path: '/api/reconstruct-3d',
};

interface ReconstructRequest {
  imageBase64: string;
  method?: 'trellis' | 'triposr';
  removeBackground?: boolean;
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'trellis' | 'triposr';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

const TRELLIS_SPACE = 'JeffreyXiang/TRELLIS';
const TRIPOSR_SPACE = 'stabilityai/TripoSR';

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

async function reconstructWithTrellis(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'trellis' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(TRELLIS_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // TRELLIS expects: image, seed, randomize_seed, ss_guidance_strength, ss_sampling_steps, slat_guidance_strength, slat_sampling_steps, mesh_simplify, texture_size
  const result = await client.predict('/image_to_3d', {
    image: imageBlob,
    seed: 0,
    randomize_seed: true,
    ss_guidance_strength: 7.5,
    ss_sampling_steps: 12,
    slat_guidance_strength: 3,
    slat_sampling_steps: 12,
    mesh_simplify: 0.95,
    texture_size: 1024,
  });

  // TRELLIS returns video preview and GLB file
  const data = result.data as { url?: string; path?: string }[];

  // Find the GLB file in the response (usually last item)
  let glbUrl: string | null = null;
  for (const item of data) {
    if (item && (item.url || item.path)) {
      const url = item.url || item.path;
      if (url && url.endsWith('.glb')) {
        glbUrl = url;
        break;
      }
    }
  }

  if (!glbUrl) {
    // Try to extract GLB from the last item which is typically the model
    const lastItem = data[data.length - 1];
    if (lastItem && (lastItem.url || lastItem.path)) {
      glbUrl = lastItem.url || lastItem.path || null;
    }
  }

  if (!glbUrl) {
    throw new Error('No GLB model returned from TRELLIS');
  }

  // Fetch the GLB file
  const glbResponse = await fetch(glbUrl);
  if (!glbResponse.ok) {
    throw new Error(`Failed to fetch GLB from TRELLIS: ${glbResponse.status}`);
  }

  const modelBlob = await glbResponse.blob();
  return { modelBlob, method: 'trellis' };
}

async function reconstructWithTripoSR(
  imageBlob: Blob,
  removeBackground: boolean
): Promise<{ modelBlob: Blob; method: 'triposr' }> {
  const hfToken = process.env.HF_TOKEN;
  const client = await Client.connect(TRIPOSR_SPACE, hfToken ? { hf_token: hfToken } : undefined);

  // TripoSR expects: image, do_remove_background, foreground_ratio, mc_resolution
  const result = await client.predict('/run', {
    image: imageBlob,
    do_remove_background: removeBackground,
    foreground_ratio: 0.85,
    mc_resolution: 256,
  });

  // TripoSR returns the GLB file directly
  const data = result.data as { url?: string; path?: string }[];

  // Find the GLB file
  let glbUrl: string | null = null;
  for (const item of data) {
    if (item && (item.url || item.path)) {
      glbUrl = item.url || item.path || null;
      break;
    }
  }

  if (!glbUrl) {
    throw new Error('No GLB model returned from TripoSR');
  }

  // Fetch the GLB file
  const glbResponse = await fetch(glbUrl);
  if (!glbResponse.ok) {
    throw new Error(`Failed to fetch GLB from TripoSR: ${glbResponse.status}`);
  }

  const modelBlob = await glbResponse.blob();
  return { modelBlob, method: 'triposr' };
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
    const preferredMethod = body.method || 'trellis';
    const removeBackground = body.removeBackground ?? true;

    let modelBlob: Blob | null = null;
    let usedMethod: 'trellis' | 'triposr' = preferredMethod;
    let lastError: Error | null = null;

    // Try preferred method first with retries
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (preferredMethod === 'trellis') {
          const result = await reconstructWithTrellis(imageBlob, removeBackground);
          modelBlob = result.modelBlob;
          usedMethod = result.method;
        } else {
          const result = await reconstructWithTripoSR(imageBlob, removeBackground);
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
    if (!modelBlob && preferredMethod === 'trellis') {
      try {
        const result = await reconstructWithTripoSR(imageBlob, removeBackground);
        modelBlob = result.modelBlob;
        usedMethod = result.method;
        lastError = null;
      } catch (error) {
        lastError = error as Error;
      }
    } else if (!modelBlob && preferredMethod === 'triposr') {
      try {
        const result = await reconstructWithTrellis(imageBlob, removeBackground);
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

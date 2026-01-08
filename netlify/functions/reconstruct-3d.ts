import type { Context } from '@netlify/functions';

interface ReconstructRequest {
  imageBase64: string;
  removeBackground?: boolean;
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'meshy';
  processingTimeMs?: number;
  error?: string;
}

interface MeshyTaskResponse {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  progress: number; // 0-100
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
  };
  texture_urls?: Array<{
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  }>;
  task_error?: {
    message: string;
  };
}

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';
const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes max
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_RETRIES = 4; // Meshy Pro gives 4 free retries per task

async function createMeshyTask(
  imageBase64: string,
  _removeBackground: boolean
): Promise<string> {
  const apiKey = process.env.MESHY_KEY;
  if (!apiKey) {
    throw new Error('MESHY_KEY environment variable not set');
  }

  // Create data URI from base64
  const dataUri = `data:image/png;base64,${imageBase64}`;

  const response = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: dataUri,
      // Use the same image to guide texture generation for better fidelity
      texture_image_url: dataUri,
      ai_model: 'meshy-5',
      topology: 'triangle',
      target_polycount: 30000,
      should_remesh: true,
      should_texture: true,
      enable_pbr: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meshy API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Response can be { result: "task_id" } or { result: { id: "task_id" } }
  const taskId = typeof data.result === 'string' ? data.result : data.result?.id;

  if (!taskId) {
    throw new Error(`No task ID in Meshy response: ${JSON.stringify(data)}`);
  }

  return taskId;
}

async function pollMeshyTask(taskId: string): Promise<MeshyTaskResponse> {
  const apiKey = process.env.MESHY_KEY;
  if (!apiKey) {
    throw new Error('MESHY_KEY environment variable not set');
  }

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    const response = await fetch(`${MESHY_API_BASE}/image-to-3d/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meshy poll error: ${response.status} - ${errorText}`);
    }

    const task: MeshyTaskResponse = await response.json();
    console.log(`Meshy task ${taskId}: ${task.status} (${task.progress}%)`);

    if (task.status === 'SUCCEEDED') {
      return task;
    }

    if (task.status === 'FAILED' || task.status === 'CANCELED') {
      throw new Error(`Meshy task failed: ${task.task_error?.message || task.status}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Meshy task timed out after 5 minutes');
}

async function downloadModel(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status}`);
  }
  return response.blob();
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
    const body: ReconstructRequest = await req.json();

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Remove data URL prefix if present
    const imageBase64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const removeBackground = body.removeBackground ?? true;

    let lastError: string = '';
    let completedTask: MeshyTaskResponse | null = null;

    // Retry loop - initial attempt + up to 4 free retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${MAX_RETRIES}...`);
        }

        console.log('Creating Meshy task...');
        const taskId = await createMeshyTask(imageBase64, removeBackground);
        console.log(`Meshy task created: ${taskId}`);

        console.log('Polling for completion...');
        completedTask = await pollMeshyTask(taskId);

        if (!completedTask.model_urls?.glb) {
          throw new Error('No GLB model URL in completed task');
        }

        // Success - break out of retry loop
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`Attempt ${attempt + 1} failed: ${lastError}`);

        if (attempt === MAX_RETRIES) {
          // All retries exhausted, throw the last error
          throw new Error(lastError);
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!completedTask?.model_urls?.glb) {
      throw new Error(lastError || 'No GLB model URL in completed task');
    }

    console.log('Downloading GLB model...');
    const modelBlob = await downloadModel(completedTask.model_urls.glb);
    const modelBase64 = await blobToBase64(modelBlob);

    const response: ReconstructResponse = {
      success: true,
      modelBase64,
      format: 'glb',
      method: 'meshy',
      processingTimeMs: Date.now() - startTime,
    };

    console.log(`Meshy reconstruction completed in ${response.processingTimeMs}ms`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Meshy reconstruction error:', errorMessage);

    const response: ReconstructResponse = {
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

import type { Context } from '@netlify/functions';

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  progress: number; // 0-100
  modelBase64?: string;
  format?: 'glb';
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
  task_error?: {
    message: string;
  };
}

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

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
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = process.env.MESHY_KEY;
    if (!apiKey) {
      throw new Error('MESHY_KEY environment variable not set');
    }

    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No taskId provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking Meshy task status: ${taskId}`);

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

    // Map Meshy status to our status
    let status: StatusResponse['status'];
    switch (task.status) {
      case 'PENDING':
        status = 'pending';
        break;
      case 'IN_PROGRESS':
        status = 'processing';
        break;
      case 'SUCCEEDED':
        status = 'succeeded';
        break;
      case 'FAILED':
      case 'CANCELED':
        status = 'failed';
        break;
      default:
        status = 'processing';
    }

    // If failed, return error
    if (status === 'failed') {
      const result: StatusResponse = {
        success: false,
        status: 'failed',
        progress: task.progress,
        error: task.task_error?.message || 'Task failed',
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If succeeded, download and return model
    if (status === 'succeeded') {
      if (!task.model_urls?.glb) {
        throw new Error('No GLB model URL in completed task');
      }

      console.log('Downloading GLB model...');
      const modelResponse = await fetch(task.model_urls.glb);
      if (!modelResponse.ok) {
        throw new Error(`Failed to download model: ${modelResponse.status}`);
      }
      const modelBlob = await modelResponse.blob();
      const modelBase64 = await blobToBase64(modelBlob);

      console.log('Model downloaded successfully');

      const result: StatusResponse = {
        success: true,
        status: 'succeeded',
        progress: 100,
        modelBase64,
        format: 'glb',
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Still processing
    const result: StatusResponse = {
      success: true,
      status,
      progress: task.progress,
    };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Meshy status check error:', errorMessage);

    const result: StatusResponse = {
      success: false,
      status: 'failed',
      progress: 0,
      error: errorMessage,
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

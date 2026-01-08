import type { Context } from '@netlify/functions';

interface ReconstructRequest {
  imageBase64: string;
  removeBackground?: boolean;
}

interface StartResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

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

  try {
    const apiKey = process.env.MESHY_KEY;
    if (!apiKey) {
      throw new Error('MESHY_KEY environment variable not set');
    }

    const body: ReconstructRequest = await req.json();

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Remove data URL prefix if present
    const imageBase64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Create data URI from base64
    const dataUri = `data:image/png;base64,${imageBase64}`;

    console.log('Creating Meshy task...');

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

    console.log(`Meshy task created: ${taskId}`);

    const result: StartResponse = {
      success: true,
      taskId,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Meshy task creation error:', errorMessage);

    const result: StartResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

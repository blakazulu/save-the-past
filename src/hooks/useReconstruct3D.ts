import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { reconstruct3D } from '@/lib/api/client';
import type { Model3D } from '@/types';

export type ReconstructionStatus = 'idle' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error';
export type ReconstructionMethod = 'single' | 'multi';

interface UseReconstruct3DOptions {
  onComplete?: (model: Model3D) => void;
  onError?: (error: string) => void;
}

export interface ReconstructOptions {
  removeBackground?: boolean;
}

export function useReconstruct3D(options: UseReconstruct3DOptions = {}) {
  const { onComplete, onError } = options;

  const [status, setStatus] = useState<ReconstructionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<Model3D | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reconstruct = useCallback(
    async (
      artifactId: string,
      imageBlobs: Blob[],
      method: ReconstructionMethod = 'single',
      reconstructOptions: ReconstructOptions = {}
    ) => {
      if (imageBlobs.length === 0) {
        setError('No images provided');
        setStatus('error');
        return;
      }

      // Reset state
      setStatus('uploading');
      setProgress(0);
      setError(null);
      setModel(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Get the removeBackground option (defaults to true for backwards compatibility)
        const removeBackground = reconstructOptions.removeBackground ?? true;

        // Select image based on method
        const imageBlob = method === 'single'
          ? imageBlobs[0]
          : imageBlobs[0]; // TODO: Multi-view reconstruction not yet supported by current AI services

        // Convert blob to base64
        setProgress(10);
        const base64 = await blobToBase64(imageBlob);
        setProgress(30);

        // Call reconstruction API (Meshy) with polling
        setStatus('processing');
        const response = await reconstruct3D(
          {
            imageBase64: base64,
            removeBackground,
          },
          // Progress callback - map Meshy's 0-100 to our 30-80 range
          (meshyProgress, meshyStatus) => {
            const mappedProgress = 30 + (meshyProgress * 0.5);
            setProgress(mappedProgress);
            if (meshyStatus === 'pending') {
              setStatus('uploading');
            } else {
              setStatus('processing');
            }
          }
        );

        if (!response.success || !response.modelBase64) {
          throw new Error(response.error || 'Reconstruction failed');
        }

        setProgress(80);

        // Convert base64 to blob
        setStatus('saving');
        const modelBlob = base64ToBlob(response.modelBase64!, 'model/gltf-binary');
        setProgress(90);

        // Create model record
        const modelId = uuidv4();
        const now = new Date();
        const newModel: Model3D = {
          id: modelId,
          artifactId,
          blob: modelBlob,
          format: 'glb',
          createdAt: now,
          source: method === 'single' ? '3d-single' : '3d-multi',
          metadata: {
            fileSize: modelBlob.size,
          },
        };

        // Save to database
        await db.models.add(newModel);

        // Update artifact with model ID
        await db.artifacts.update(artifactId, {
          model3DId: modelId,
          status: 'complete',
          updatedAt: now,
        });

        setProgress(100);
        setModel(newModel);
        setStatus('complete');
        onComplete?.(newModel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setStatus('error');
        onError?.(errorMessage);
      }
    },
    [onComplete, onError]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setModel(null);
  }, []);

  return {
    reconstruct,
    cancel,
    reset,
    status,
    progress,
    error,
    model,
    isProcessing: status === 'uploading' || status === 'processing' || status === 'saving',
  };
}

// Helper functions
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

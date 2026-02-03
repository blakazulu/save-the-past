import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, quantize, prune } from '@gltf-transform/functions';
import { logger } from '@/lib/utils/logger';

const io = new WebIO().registerExtensions(ALL_EXTENSIONS);

/**
 * Custom error class for model optimization failures
 */
export class ModelOptimizationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly phase?: 'validation' | 'read' | 'transform' | 'write'
  ) {
    super(message);
    this.name = 'ModelOptimizationError';
  }
}

/**
 * Validate that a blob appears to be a valid GLB file
 */
function validateGLB(blob: Blob): void {
  if (!blob || blob.size === 0) {
    throw new ModelOptimizationError('Empty or null blob', undefined, 'validation');
  }

  if (blob.type && blob.type !== 'model/gltf-binary' && blob.type !== 'application/octet-stream') {
    throw new ModelOptimizationError(`Invalid blob type: ${blob.type}`, undefined, 'validation');
  }

  // GLB files must be at least 12 bytes (header) + 8 bytes (chunk header) = 20 bytes minimum
  if (blob.size < 20) {
    throw new ModelOptimizationError('Blob too small to be valid GLB', undefined, 'validation');
  }
}

/**
 * Optimize a GLB model for web delivery.
 * Applies:
 * - Deduplication (removes duplicate data)
 * - Quantization (reduces vertex precision, ~50-70% size reduction)
 * - Pruning (removes unused nodes/materials)
 *
 * @throws {ModelOptimizationError} If optimization fails
 */
export async function optimizeModel(blob: Blob): Promise<Blob> {
  try {
    // Validate input
    validateGLB(blob);

    // Read GLB
    const arrayBuffer = await blob.arrayBuffer();
    const document = await io.readBinary(new Uint8Array(arrayBuffer));

    if (!document) {
      throw new ModelOptimizationError('Failed to parse GLB document', undefined, 'read');
    }

    // Apply optimizations
    try {
      await document.transform(
        dedup(),
        prune(),
        quantize({
          quantizePosition: 14, // 14-bit precision for positions (default is 16)
          quantizeNormal: 10,   // 10-bit precision for normals
          quantizeTexcoord: 12, // 12-bit precision for UVs
          quantizeColor: 8,     // 8-bit precision for colors
        })
      );
    } catch (error) {
      throw new ModelOptimizationError(
        'Transform operations failed',
        error,
        'transform'
      );
    }

    // Write optimized model
    let optimizedBuffer: Uint8Array;
    try {
      optimizedBuffer = await io.writeBinary(document);
    } catch (error) {
      throw new ModelOptimizationError(
        'Failed to write optimized model',
        error,
        'write'
      );
    }

    const originalSize = blob.size;
    const optimizedSize = optimizedBuffer.byteLength;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    logger.log(`Model optimized: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${reduction}% reduction)`);

    // Create a new ArrayBuffer from Uint8Array to ensure type compatibility
    const outputBuffer = new ArrayBuffer(optimizedBuffer.byteLength);
    new Uint8Array(outputBuffer).set(optimizedBuffer);
    return new Blob([outputBuffer], { type: 'model/gltf-binary' });
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof ModelOptimizationError) {
      logger.warn(`Model optimization failed at ${error.phase}:`, error.message);
      throw error;
    }

    // Wrap unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Model optimization failed with unexpected error:', errorMessage);
    throw new ModelOptimizationError(
      `Unexpected optimization failure: ${errorMessage}`,
      error,
      'validation'
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

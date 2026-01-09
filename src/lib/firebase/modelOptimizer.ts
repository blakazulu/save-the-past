import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, quantize, prune } from '@gltf-transform/functions';

const io = new WebIO().registerExtensions(ALL_EXTENSIONS);

/**
 * Optimize a GLB model for web delivery.
 * Applies:
 * - Deduplication (removes duplicate data)
 * - Quantization (reduces vertex precision, ~50-70% size reduction)
 * - Pruning (removes unused nodes/materials)
 */
export async function optimizeModel(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const document = await io.readBinary(new Uint8Array(arrayBuffer));

    // Apply optimizations
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

    // Write optimized model
    const optimizedBuffer = await io.writeBinary(document);

    const originalSize = blob.size;
    const optimizedSize = optimizedBuffer.byteLength;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    console.log(`Model optimized: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${reduction}% reduction)`);

    return new Blob([optimizedBuffer], { type: 'model/gltf-binary' });
  } catch (error) {
    console.warn('Model optimization failed, using original:', error);
    // Return original blob if optimization fails
    return blob;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

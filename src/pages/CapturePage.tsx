import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';
import { CameraIcon, UploadIcon } from '@/components/icons';
import { CaptureSession, CapturePreview, FileUpload } from '@/components/camera';
import { useCaptureStore } from '@/stores';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

type CaptureMode = 'select' | 'camera' | 'upload' | 'preview';

// Helper to get image dimensions from a blob
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  });
}

export default function CapturePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CaptureMode>('select');
  const { capturedImages, clearCapturedImages } = useCaptureStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleCameraComplete = () => {
    setMode('preview');
  };

  const handleUploadComplete = () => {
    setMode('preview');
  };

  const handleRetake = () => {
    setMode('camera');
  };

  const handleCancel = () => {
    clearCapturedImages();
    setMode('select');
  };

  const handleCreateArtifact = async () => {
    if (capturedImages.length === 0 || isCreating) return;

    setIsCreating(true);

    try {
      const artifactId = uuidv4();
      const now = new Date();
      const imageIds = capturedImages.map((img) => img.id);

      // Create the artifact
      await db.artifacts.add({
        id: artifactId,
        createdAt: now,
        updatedAt: now,
        status: 'images-captured',
        imageIds,
        metadata: {
          name: t('artifact.defaultName', { date: now.toLocaleDateString() }),
        },
      });

      // Save all images with dimensions
      for (const img of capturedImages) {
        const dimensions = await getImageDimensions(img.blob);
        await db.images.add({
          id: img.id,
          artifactId,
          blob: img.blob,
          angle: img.angle,
          createdAt: now,
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      // Clean up preview URLs and state
      capturedImages.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
      });
      clearCapturedImages();

      // Navigate to the new artifact
      navigate(`/artifact/${artifactId}`);
    } catch (error) {
      console.error('Failed to create artifact:', error);
      setIsCreating(false);
    }
  };

  // Camera capture mode
  if (mode === 'camera') {
    return (
      <CaptureSession
        onComplete={handleCameraComplete}
        onCancel={handleCancel}
      />
    );
  }

  // File upload mode
  if (mode === 'upload') {
    return (
      <FileUpload
        onComplete={handleUploadComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Preview mode
  if (mode === 'preview') {
    return (
      <CapturePreview
        onConfirm={handleCreateArtifact}
        onRetake={handleRetake}
        onCancel={handleCancel}
      />
    );
  }

  // Selection mode (default)
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader title={t('capture.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <p className="text-center text-text-secondary mb-8">
            {t('capture.instructions')}
          </p>

          {/* Camera Button */}
          <button
            onClick={() => setMode('camera')}
            className="w-full bg-terracotta text-white p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-clay transition-colors shadow-lg"
          >
            <CameraIcon className="w-8 h-8" />
            <span className="text-lg font-semibold">{t('capture.camera')}</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => setMode('upload')}
            className="w-full bg-white text-earth border-2 border-sand p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-sand transition-colors"
          >
            <UploadIcon className="w-8 h-8" />
            <span className="text-lg font-semibold">{t('capture.upload')}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

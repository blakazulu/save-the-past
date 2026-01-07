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
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('capture.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Decorative header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta/20 to-clay/10 flex items-center justify-center">
                <CameraIcon className="w-10 h-10 text-terracotta" />
              </div>
            </div>
            <p className="text-text-secondary font-manuscript text-lg italic">
              {t('capture.instructions')}
            </p>
          </div>

          {/* Option Cards */}
          <div className="space-y-4">
            {/* Camera Option */}
            <button
              onClick={() => setMode('camera')}
              className="parchment-card corners-decorated w-full p-6 text-left transition-all duration-200 hover:shadow-lg group animate-fade-in-up"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-terracotta to-clay flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <CameraIcon className="w-7 h-7 text-parchment-light" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-earth mb-1">
                    {t('capture.camera')}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t('capture.cameraDescription', 'Take photos directly with your device camera')}
                  </p>
                </div>
              </div>
            </button>

            {/* Decorative divider */}
            <div className="divider-ornate my-6">
              <span className="font-manuscript text-sm">{t('common.or', 'or')}</span>
            </div>

            {/* Upload Option */}
            <button
              onClick={() => setMode('upload')}
              className="parchment-card corners-decorated w-full p-6 text-left transition-all duration-200 hover:shadow-lg group animate-fade-in-up stagger-2"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-sand to-parchment-dark flex items-center justify-center flex-shrink-0 shadow-md border border-sepia/20 group-hover:scale-105 transition-transform">
                  <UploadIcon className="w-7 h-7 text-earth" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-earth mb-1">
                    {t('capture.upload')}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t('capture.uploadDescription', 'Select existing photos from your gallery')}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Decorative footer */}
          <div className="mt-10 text-center animate-fade-in stagger-3">
            <p className="text-xs text-text-muted font-manuscript">
              {t('capture.hint', 'Multiple angles help create better 3D reconstructions')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

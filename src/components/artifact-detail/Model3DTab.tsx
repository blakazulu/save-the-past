import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { ReconstructionCard } from '@/components/reconstruction/ReconstructionCard';
import { useReconstruct3D } from '@/hooks/useReconstruct3D';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Artifact, Model3D } from '@/types';
import type { ReconstructionMethod } from '@/components/reconstruction/MethodSelector';
import type { TextureMode } from '@/components/reconstruction/TextureModeSelector';

interface Model3DTabProps {
  artifact: Artifact;
}

export function Model3DTab({ artifact }: Model3DTabProps) {
  const { t } = useTranslation();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ReconstructionMethod>('single');
  const [textureMode, setTextureMode] = useState<TextureMode>('auto');
  const [manualTexturePrompt, setManualTexturePrompt] = useState('');
  const autoRemoveBackground = useSettingsStore((state) => state.autoRemoveBackground);

  // Load the 3D model if it exists
  const model = useLiveQuery(
    () => (artifact.model3DId ? db.models.get(artifact.model3DId) : undefined),
    [artifact.model3DId]
  );

  // Load images for reconstruction
  const images = useLiveQuery(
    () => db.images.where('artifactId').equals(artifact.id).toArray(),
    [artifact.id]
  );

  // Reconstruction hook
  const {
    reconstruct,
    status,
    progress,
    error,
    reset,
  } = useReconstruct3D({
    onComplete: async (newModel: Model3D) => {
      // Update artifact with model ID
      await db.artifacts.update(artifact.id, {
        model3DId: newModel.id,
        status: artifact.infoCardId ? 'complete' : 'images-captured',
        updatedAt: new Date(),
      });
    },
  });

  // Create object URL for model blob
  useEffect(() => {
    if (model?.blob) {
      const url = URL.createObjectURL(model.blob);
      setModelUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setModelUrl(null);
  }, [model]);

  const handleStartReconstruction = async () => {
    if (!images || images.length === 0) return;
    const imageBlobs = images.map((img) => img.blob);
    await reconstruct(artifact.id, imageBlobs, selectedMethod, {
      removeBackground: autoRemoveBackground,
      textureMode,
      manualTexturePrompt: textureMode === 'manual' ? manualTexturePrompt : undefined,
    });
  };

  // Map hook status to component status
  const componentStatus = status === 'analyzing' || status === 'uploading' || status === 'processing' || status === 'saving'
    ? 'processing'
    : status === 'error'
      ? 'error'
      : status === 'complete'
        ? 'complete'
        : 'idle';

  // Map hook status to progress status
  const progressStatus = status === 'analyzing'
    ? 'analyzing'
    : status === 'uploading'
      ? 'uploading'
      : status === 'saving'
        ? 'saving'
        : 'processing';

  // If model exists and we're not reprocessing, show viewer
  if (model && modelUrl && componentStatus !== 'processing') {
    return (
      <div className="flex flex-col">
        <div className="h-[70vh] w-[70vw] mx-auto">
          <ModelViewer modelUrl={modelUrl} className="w-full h-full" />
        </div>
        <div className="p-4 bg-white border-t border-sand">
          <div className="flex items-center justify-between text-base text-text-secondary">
            <span>
              {t('reconstruction.complete')} - {model.source === '3d-single' ? 'Single Image' : 'Multi Image'}
            </span>
            {model.metadata?.fileSize && (
              <span>{(model.metadata.fileSize / 1024).toFixed(1)} KB</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show reconstruction card
  return (
    <div className="p-4">
      <ReconstructionCard
        status={componentStatus}
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
        textureMode={textureMode}
        onTextureModeChange={setTextureMode}
        manualTexturePrompt={manualTexturePrompt}
        onManualTexturePromptChange={setManualTexturePrompt}
        onStartReconstruction={handleStartReconstruction}
        onRetry={reset}
        imageCount={images?.length || 0}
        progress={progress}
        progressStatus={progressStatus}
        errorMessage={error || undefined}
        hasModel={!!model}
        hasInfoCard={!!artifact.infoCardId}
      />
    </div>
  );
}

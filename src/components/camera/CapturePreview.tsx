import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaptureStore } from '@/stores';
import { BackIcon, TrashIcon } from '@/components/icons';
import type { ImageAngle, CaptureImage } from '@/types';

interface CapturePreviewProps {
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
}

const ANGLE_LABELS: Record<ImageAngle, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
  detail: 'Detail',
  context: 'Context',
};

export function CapturePreview({
  onConfirm,
  onRetake,
  onCancel,
}: CapturePreviewProps) {
  const { t } = useTranslation();
  const { capturedImages, removeCapturedImage, updateImageAngle } =
    useCaptureStore();
  const [selectedImage, setSelectedImage] = useState<CaptureImage | null>(
    capturedImages[0] || null
  );
  const [showAngleSelector, setShowAngleSelector] = useState(false);

  const handleRemoveImage = (id: string) => {
    removeCapturedImage(id);
    if (selectedImage?.id === id) {
      setSelectedImage(capturedImages.find((img) => img.id !== id) || null);
    }
  };

  const handleAngleChange = (angle: ImageAngle) => {
    if (selectedImage) {
      updateImageAngle(selectedImage.id, angle);
      setSelectedImage({ ...selectedImage, angle });
    }
    setShowAngleSelector(false);
  };

  if (capturedImages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
        <div className="parchment-card p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-sand/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl opacity-50">📷</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-earth mb-4">
            {t('capture.noPhotos')}
          </h2>
          <button
            onClick={onCancel}
            className="btn-seal"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-area-top safe-area-bottom bg-burnt/95">
      {/* Header */}
      <div className="glass-parchment border-b border-sepia/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 hover:bg-sand/50 rounded-lg transition-colors"
          >
            <BackIcon className="w-5 h-5 text-earth" />
          </button>
          <h1 className="font-display text-lg font-semibold text-earth">
            {t('capture.reviewPhotos')}
          </h1>
          <button
            onClick={onRetake}
            className="text-terracotta font-medium hover:text-clay text-sm"
          >
            {t('capture.addMore')}
          </button>
        </div>
      </div>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Main preview - constrained height */}
          {selectedImage && (
            <div className="parchment-card p-2 mb-4">
              <div className="relative rounded overflow-hidden bg-burnt/10 flex items-center justify-center" style={{ maxHeight: '50vh' }}>
                <img
                  src={selectedImage.previewUrl}
                  alt={selectedImage.angle}
                  className="max-w-full max-h-[50vh] object-contain"
                />

                {/* Angle badge */}
                <button
                  onClick={() => setShowAngleSelector(true)}
                  className="absolute top-3 right-3 bg-burnt/70 text-parchment-light px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
                >
                  {t(`capture.angles.${selectedImage.angle}`)}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleRemoveImage(selectedImage.id)}
                  className="absolute top-3 left-3 bg-error/80 text-white p-2 rounded backdrop-blur-sm"
                  aria-label={t('common.delete')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          <div className="parchment-card p-3">
            <p className="text-sm text-text-muted font-manuscript mb-2">
              {t('capture.photosCount', { count: capturedImages.length })}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {capturedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage?.id === img.id
                      ? 'border-terracotta shadow-md scale-105'
                      : 'border-sepia/20 hover:border-terracotta/50'
                  }`}
                >
                  <img
                    src={img.previewUrl}
                    alt={img.angle}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions - fixed */}
      <div className="glass-parchment border-t border-sepia/20 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={onConfirm}
            className="btn-seal w-full"
          >
            {t('capture.createArtifact')}
          </button>
        </div>
      </div>

      {/* Angle selector modal */}
      {showAngleSelector && (
        <div
          className="fixed inset-0 bg-burnt/60 z-60 flex items-center md:items-center justify-end md:justify-center animate-fade-in"
          onClick={() => setShowAngleSelector(false)}
        >
          <div
            className="glass-parchment w-full md:w-auto md:min-w-[400px] md:rounded-2xl rounded-t-2xl safe-area-bottom animate-slide-up md:animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-sepia/40 to-transparent" />
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-earth mb-4 text-center">
                {t('capture.selectAngle')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ANGLE_LABELS) as ImageAngle[]).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => handleAngleChange(angle)}
                    className={`p-3 rounded text-left transition-all ${
                      selectedImage?.angle === angle
                        ? 'bg-terracotta text-parchment-light shadow-md'
                        : 'parchment-card text-earth hover:bg-sand'
                    }`}
                  >
                    {t(`capture.angles.${angle}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

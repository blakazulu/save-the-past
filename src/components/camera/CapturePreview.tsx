import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaptureStore } from '@/stores';
import { BackIcon, TrashIcon, CameraIcon } from '@/components/icons';
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
            <CameraIcon className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-display text-xl font-semibold text-earth mb-4">
            {t('capture.noPhotos')}
          </h2>
          <button onClick={onCancel} className="btn-seal">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="bg-parchment-light/80 border-b border-sand">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 hover:bg-sand/50 rounded-lg transition-colors"
          >
            <BackIcon className="w-5 h-5 text-earth rtl:rotate-180" />
          </button>
          <h1 className="font-display text-lg font-semibold text-earth">
            {t('capture.reviewPhotos')}
          </h1>
          <button
            onClick={onRetake}
            className="flex items-center gap-1.5 text-terracotta font-medium hover:text-clay transition-colors"
          >
            <CameraIcon className="w-4 h-4" />
            <span className="text-sm">{t('capture.addMore')}</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Main preview */}
          {selectedImage && (
            <div className="parchment-card overflow-hidden">
              {/* Image container with dark background for contrast */}
              <div className="relative bg-ink/90 flex items-center justify-center">
                <img
                  src={selectedImage.previewUrl}
                  alt={selectedImage.angle}
                  className="max-w-full max-h-[55vh] object-contain"
                />

                {/* Angle badge - top right */}
                <button
                  onClick={() => setShowAngleSelector(true)}
                  className="absolute top-3 right-3 bg-parchment/95 text-earth px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-md hover:bg-parchment-light transition-colors"
                >
                  <span>{t(`capture.angles.${selectedImage.angle}`)}</span>
                  <svg
                    className="w-3.5 h-3.5 text-text-muted"
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

                {/* Delete button - top left */}
                <button
                  onClick={() => handleRemoveImage(selectedImage.id)}
                  className="absolute top-3 left-3 bg-error/90 hover:bg-error text-white p-2 rounded-md shadow-md transition-colors"
                  aria-label={t('common.delete')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          <div className="parchment-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-text-secondary font-medium">
                {t('capture.photosCount', { count: capturedImages.length })}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {capturedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage?.id === img.id
                      ? 'ring-2 ring-terracotta ring-offset-2 ring-offset-parchment scale-105'
                      : 'ring-1 ring-sand hover:ring-terracotta/50'
                  }`}
                >
                  <img
                    src={img.previewUrl}
                    alt={img.angle}
                    className="w-full h-full object-cover"
                  />
                  {/* Angle label */}
                  <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-parchment-light text-xs py-0.5 text-center truncate">
                    {t(`capture.angles.${img.angle}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="bg-parchment-light/80 border-t border-sand p-4">
        <div className="max-w-md mx-auto">
          <button onClick={onConfirm} className="btn-seal w-full">
            {t('capture.createArtifact')}
          </button>
        </div>
      </div>

      {/* Angle selector modal */}
      {showAngleSelector && (
        <div
          className="fixed inset-0 bg-ink/50 z-60 flex items-end md:items-center justify-center animate-fade-in"
          onClick={() => setShowAngleSelector(false)}
        >
          <div
            className="bg-parchment-light w-full md:w-auto md:min-w-[360px] md:max-w-md md:rounded-xl rounded-t-xl safe-area-bottom animate-slide-up md:animate-fade-in-up shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-sand" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-earth mb-4 text-center">
                {t('capture.selectAngle')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ANGLE_LABELS) as ImageAngle[]).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => handleAngleChange(angle)}
                    className={`p-3 rounded-lg text-center transition-all font-medium ${
                      selectedImage?.angle === angle
                        ? 'bg-terracotta text-parchment-light shadow-md'
                        : 'bg-parchment hover:bg-sand text-earth border border-sand'
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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaptureStore } from '@/stores';
import { BackIcon } from '@/components/icons';
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
      <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-earth mb-4">
            {t('capture.noPhotos')}
          </h2>
          <button
            onClick={onCancel}
            className="bg-terracotta text-white px-6 py-3 rounded-xl font-semibold"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sand">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 hover:bg-sand rounded-full transition-colors"
        >
          <BackIcon className="w-6 h-6 text-earth" />
        </button>
        <h1 className="text-lg font-semibold text-earth">
          {t('capture.reviewPhotos')}
        </h1>
        <button
          onClick={onRetake}
          className="text-terracotta font-medium hover:text-clay"
        >
          {t('capture.addMore')}
        </button>
      </div>

      {/* Main preview */}
      <div className="flex-1 p-4 flex flex-col">
        {selectedImage && (
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-sand">
            <img
              src={selectedImage.previewUrl}
              alt={selectedImage.angle}
              className="w-full h-full object-contain"
            />

            {/* Angle badge */}
            <button
              onClick={() => setShowAngleSelector(true)}
              className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
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
              className="absolute top-4 left-4 bg-error/80 text-white p-2 rounded-full"
              aria-label={t('common.delete')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Thumbnail strip */}
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage?.id === img.id
                    ? 'border-terracotta'
                    : 'border-transparent hover:border-clay'
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

      {/* Bottom actions */}
      <div className="p-4 border-t border-sand">
        <p className="text-center text-sm text-text-secondary mb-3">
          {t('capture.photosCount', { count: capturedImages.length })}
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-terracotta text-white py-4 rounded-xl font-semibold hover:bg-clay transition-colors"
        >
          {t('capture.createArtifact')}
        </button>
      </div>

      {/* Angle selector modal */}
      {showAngleSelector && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-end"
          onClick={() => setShowAngleSelector(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-4 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-earth mb-4 text-center">
              {t('capture.selectAngle')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ANGLE_LABELS) as ImageAngle[]).map((angle) => (
                <button
                  key={angle}
                  onClick={() => handleAngleChange(angle)}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    selectedImage?.angle === angle
                      ? 'bg-terracotta text-white'
                      : 'bg-sand text-earth hover:bg-clay hover:text-white'
                  }`}
                >
                  {t(`capture.angles.${angle}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { CameraView } from './CameraView';
import { CaptureOverlay, CAPTURE_ANGLES } from './CaptureOverlay';
import { useCaptureStore } from '@/stores';
import { BackIcon } from '@/components/icons';
import type { ImageAngle } from '@/types';

interface CaptureSessionProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function CaptureSession({ onComplete, onCancel }: CaptureSessionProps) {
  const { t } = useTranslation();
  const { capturedImages, addCapturedImage } = useCaptureStore();
  const [error, setError] = useState<string | null>(null);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);

  const currentAngle = CAPTURE_ANGLES[currentAngleIndex] || 'detail';
  const isLastAngle = currentAngleIndex >= CAPTURE_ANGLES.length - 1;

  const handleCapture = useCallback(
    (blob: Blob) => {
      const previewUrl = URL.createObjectURL(blob);
      const image = {
        id: uuidv4(),
        blob,
        angle: currentAngle as ImageAngle,
        previewUrl,
      };

      addCapturedImage(image);

      if (isLastAngle) {
        // All required angles captured
        onComplete();
      } else {
        // Move to next angle
        setCurrentAngleIndex((prev) => prev + 1);
      }
    },
    [currentAngle, isLastAngle, addCapturedImage, onComplete]
  );

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleSkip = useCallback(() => {
    if (isLastAngle) {
      onComplete();
    } else {
      setCurrentAngleIndex((prev) => prev + 1);
    }
  }, [isLastAngle, onComplete]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <h2 className="text-xl font-semibold text-earth mb-2">
            {t('capture.cameraError')}
          </h2>
          <p className="text-text-secondary mb-6">{error}</p>
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-full bg-black/50 text-white text-base"
          >
            {isLastAngle ? t('capture.finish') : t('capture.skip')}
          </button>
        </div>
      </div>

      {/* Camera view with overlay */}
      <div className="flex-1 relative">
        <CameraView onCapture={handleCapture} onError={handleError} />
        <CaptureOverlay
          suggestedAngle={currentAngle}
          capturedCount={capturedImages.length}
          totalAngles={CAPTURE_ANGLES.length}
        />
      </div>

      {/* Thumbnail strip */}
      {capturedImages.length > 0 && (
        <div className="absolute bottom-28 left-0 right-0 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedImages.map((img) => (
              <div
                key={img.id}
                className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/50"
              >
                <img
                  src={img.previewUrl}
                  alt={img.angle}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

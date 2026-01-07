import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useCaptureStore } from '@/stores';
import { UploadIcon, BackIcon } from '@/components/icons';
import type { ImageAngle } from '@/types';

interface FileUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

const DEFAULT_ANGLES: ImageAngle[] = [
  'front',
  'back',
  'left',
  'right',
  'top',
  'bottom',
  'detail',
  'context',
];

export function FileUpload({ onComplete, onCancel }: FileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCapturedImage, capturedImages } = useCaptureStore();
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith('image/')
      );

      imageFiles.forEach((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        const angle = DEFAULT_ANGLES[capturedImages.length + index] || 'detail';

        addCapturedImage({
          id: uuidv4(),
          blob: file,
          angle,
          previewUrl,
        });
      });

      if (imageFiles.length > 0 && capturedImages.length + imageFiles.length >= 1) {
        onComplete();
      }
    },
    [addCapturedImage, capturedImages.length, onComplete]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col safe-area-top safe-area-bottom">
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
            {t('capture.upload')}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Upload area */}
      <div className="flex-1 p-4 md:p-6 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex-1 parchment-card border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-terracotta bg-terracotta/5'
                : 'border-sepia/30 hover:border-terracotta hover:bg-sand/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isDragging ? 'bg-terracotta/20' : 'bg-sand/50'
              }`}
            >
              <UploadIcon
                className={`w-10 h-10 ${
                  isDragging ? 'text-terracotta' : 'text-earth/50'
                }`}
              />
            </div>

            <h2 className="font-display text-xl font-semibold text-earth mb-2">
              {isDragging ? t('capture.dropHere') : t('capture.dragDrop')}
            </h2>

            <p className="text-text-secondary text-center max-w-xs font-manuscript italic">
              {t('capture.uploadHint')}
            </p>

            <button className="btn-seal mt-6">
              {t('capture.browseFiles')}
            </button>
          </div>

          {/* Preview thumbnails */}
          {capturedImages.length > 0 && (
            <div className="mt-4 parchment-card p-3">
              <p className="text-sm text-text-muted font-manuscript mb-2">
                {t('capture.selectedPhotos', { count: capturedImages.length })}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {capturedImages.map((img) => (
                  <div
                    key={img.id}
                    className="w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden flex-shrink-0 border border-sepia/20"
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
      </div>

      {/* Continue button */}
      {capturedImages.length > 0 && (
        <div className="glass-parchment border-t border-sepia/20 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={onComplete}
              className="btn-seal w-full"
            >
              {t('capture.continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

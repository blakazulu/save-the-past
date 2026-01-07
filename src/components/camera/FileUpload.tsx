import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useCaptureStore } from '@/stores';
import { UploadIcon } from '@/components/icons';
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
    <div className="fixed inset-0 bg-bg z-50 flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sand">
        <button
          onClick={onCancel}
          className="text-text-secondary hover:text-earth"
        >
          {t('common.cancel')}
        </button>
        <h1 className="text-lg font-semibold text-earth">
          {t('capture.upload')}
        </h1>
        <div className="w-16" />
      </div>

      {/* Upload area */}
      <div className="flex-1 p-6 flex flex-col">
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-terracotta bg-terracotta/10'
              : 'border-sand hover:border-clay hover:bg-sand/50'
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
              isDragging ? 'bg-terracotta/20' : 'bg-sand'
            }`}
          >
            <UploadIcon
              className={`w-10 h-10 ${
                isDragging ? 'text-terracotta' : 'text-clay'
              }`}
            />
          </div>

          <h2 className="text-xl font-semibold text-earth mb-2">
            {isDragging ? t('capture.dropHere') : t('capture.dragDrop')}
          </h2>

          <p className="text-text-secondary text-center max-w-xs">
            {t('capture.uploadHint')}
          </p>

          <button className="mt-6 bg-terracotta text-white px-6 py-3 rounded-xl font-semibold hover:bg-clay transition-colors">
            {t('capture.browseFiles')}
          </button>
        </div>

        {/* Preview thumbnails */}
        {capturedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-text-secondary mb-2">
              {t('capture.selectedPhotos', { count: capturedImages.length })}
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {capturedImages.map((img) => (
                <div
                  key={img.id}
                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-sand"
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

      {/* Continue button */}
      {capturedImages.length > 0 && (
        <div className="p-4 border-t border-sand">
          <button
            onClick={onComplete}
            className="w-full bg-terracotta text-white py-4 rounded-xl font-semibold hover:bg-clay transition-colors"
          >
            {t('capture.continue')}
          </button>
        </div>
      )}
    </div>
  );
}

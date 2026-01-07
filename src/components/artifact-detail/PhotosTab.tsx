import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TrashIcon } from '@/components/icons';
import type { Artifact, ArtifactImage } from '@/types';

interface PhotosTabProps {
  artifact: Artifact;
}

export function PhotosTab({ artifact }: PhotosTabProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<ArtifactImage | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  // Load images for this artifact
  const images = useLiveQuery(
    () => db.images.where('artifactId').equals(artifact.id).toArray(),
    [artifact.id]
  );

  // Create object URLs for images
  useEffect(() => {
    if (!images) return;

    const urls = new Map<string, string>();
    images.forEach((img) => {
      urls.set(img.id, URL.createObjectURL(img.blob));
    });
    setImageUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      if (!confirm(t('common.delete') + '?')) return;

      await db.images.delete(imageId);

      // Update artifact imageIds
      const updatedImageIds = artifact.imageIds.filter((id) => id !== imageId);
      await db.artifacts.update(artifact.id, {
        imageIds: updatedImageIds,
        updatedAt: new Date(),
      });

      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    },
    [artifact, selectedImage, t]
  );

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-sand flex items-center justify-center mb-4">
          <span className="text-4xl">📷</span>
        </div>
        <h3 className="text-lg font-semibold text-earth mb-2">
          {t('capture.noPhotos')}
        </h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Photo grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="relative aspect-square rounded-lg overflow-hidden bg-sand group"
            >
              {imageUrls.get(image.id) && (
                <img
                  src={imageUrls.get(image.id)}
                  alt={t(`capture.angles.${image.angle}`)}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                {t(`capture.angles.${image.angle}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo count */}
      <div className="p-4 bg-white border-t border-sand">
        <p className="text-sm text-text-secondary text-center">
          {t('gallery.photoCount', { count: images.length })}
        </p>
      </div>

      {/* Full-screen image viewer */}
      {selectedImage && imageUrls.get(selectedImage.id) && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={handleCloseViewer}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={handleCloseViewer}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm">
              {t(`capture.angles.${selectedImage.angle}`)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteImage(selectedImage.id);
              }}
              className="p-2 hover:bg-white/10 rounded-full text-red-400"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Image */}
          <div
            className="flex-1 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrls.get(selectedImage.id)}
              alt={t(`capture.angles.${selectedImage.angle}`)}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Footer */}
          <div className="p-4 text-white text-sm text-center">
            {selectedImage.width} × {selectedImage.height}
          </div>
        </div>
      )}
    </div>
  );
}

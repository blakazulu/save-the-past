import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/db';
import type { Artifact, ArtifactStatus } from '@/types';

interface ArtifactCardProps {
  artifact: Artifact;
  variant?: 'grid' | 'list';
}

const STATUS_STYLES: Record<ArtifactStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-sand', text: 'text-text-secondary' },
  'images-captured': { bg: 'bg-amber/20', text: 'text-amber' },
  'processing-3d': { bg: 'bg-info/20', text: 'text-info' },
  'processing-info': { bg: 'bg-info/20', text: 'text-info' },
  complete: { bg: 'bg-success/20', text: 'text-success' },
  error: { bg: 'bg-error/20', text: 'text-error' },
};

export function ArtifactCard({ artifact, variant = 'grid' }: ArtifactCardProps) {
  const { t } = useTranslation();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    async function loadThumbnail() {
      // First try artifact's thumbnail blob
      if (artifact.thumbnailBlob) {
        url = URL.createObjectURL(artifact.thumbnailBlob);
        setThumbnailUrl(url);
        return;
      }

      // Fallback to first image
      if (artifact.imageIds.length > 0) {
        const firstImage = await db.images.get(artifact.imageIds[0]);
        if (firstImage?.blob) {
          url = URL.createObjectURL(firstImage.blob);
          setThumbnailUrl(url);
        }
      }
    }

    loadThumbnail();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [artifact.thumbnailBlob, artifact.imageIds]);

  const statusStyle = STATUS_STYLES[artifact.status];
  const name = artifact.metadata.name || t('artifact.defaultName', { date: artifact.createdAt.toLocaleDateString() });
  const photoCount = artifact.imageIds.length;

  if (variant === 'list') {
    return (
      <Link
        to={`/artifact/${artifact.id}`}
        className="flex items-center gap-4 p-3 bg-white rounded-xl hover:bg-sand/50 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-sand flex-shrink-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">🏺</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-earth truncate">{name}</h3>
          <p className="text-sm text-text-secondary">
            {t('gallery.photoCount', { count: photoCount })}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {t(`gallery.status.${artifact.status}`)}
        </span>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      to={`/artifact/${artifact.id}`}
      className="block bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-sand relative">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🏺</span>
          </div>
        )}

        {/* Status badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {t(`gallery.status.${artifact.status}`)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-earth truncate">{name}</h3>
        <p className="text-sm text-text-secondary mt-1">
          {t('gallery.photoCount', { count: photoCount })}
        </p>
      </div>
    </Link>
  );
}

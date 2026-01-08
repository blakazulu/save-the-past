import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/db';
import { useJobsStore, useJobsHydrated } from '@/stores/jobsStore';
import type { Artifact, ArtifactStatus } from '@/types';

interface ArtifactCardProps {
  artifact: Artifact;
  variant?: 'grid' | 'list';
}

const STATUS_BADGES: Record<ArtifactStatus, string> = {
  draft: 'badge-draft',
  'images-captured': 'badge-captured',
  'processing-3d': 'badge-processing',
  'processing-info': 'badge-processing',
  complete: 'badge-complete',
  error: 'badge-error',
};

export function ArtifactCard({ artifact, variant = 'grid' }: ArtifactCardProps) {
  const { t } = useTranslation();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const getJobByArtifactId = useJobsStore((state) => state.getJobByArtifactId);
  const hasHydrated = useJobsHydrated();

  // Check for active processing job (only after hydration)
  const activeJob = hasHydrated ? getJobByArtifactId(artifact.id) : undefined;
  const isProcessing = activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing');

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

  const badgeClass = STATUS_BADGES[artifact.status];
  const name = artifact.metadata.name || t('artifact.defaultName', { date: artifact.createdAt.toLocaleDateString() });
  const photoCount = artifact.imageIds.length;

  if (variant === 'list') {
    return (
      <Link
        to={`/artifact/${artifact.id}`}
        className="parchment-card flex items-center gap-4 p-3 transition-all duration-200 hover:shadow-lg group"
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded overflow-hidden bg-sand/50 flex-shrink-0 border border-sepia/15">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover sepia-light group-hover:filter-none transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sand to-parchment-dark">
              <span className="text-2xl opacity-50">🏺</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-earth truncate group-hover:text-terracotta transition-colors">
            {name}
          </h3>
          <p className="text-base text-text-muted font-manuscript italic">
            {t('gallery.photoCount', { count: photoCount })}
          </p>
        </div>

        {/* Status badge or progress */}
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-300"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{Math.round(activeJob.progress)}%</span>
          </div>
        ) : (
          <span className={`badge-status ${badgeClass}`}>
            {t(`gallery.status.${artifact.status}`)}
          </span>
        )}
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      to={`/artifact/${artifact.id}`}
      className="parchment-card block overflow-hidden transition-all duration-200 hover:shadow-lg group"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-sand/30 relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover sepia-light group-hover:filter-none group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sand to-parchment-dark">
            <span className="text-4xl opacity-40">🏺</span>
          </div>
        )}

        {/* Status badge */}
        <span className={`badge-status ${badgeClass} absolute top-2 right-2`}>
          {t(`gallery.status.${artifact.status}`)}
        </span>

        {/* Processing progress overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-burnt/60 flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-2">
              <div className="cube-container scale-75">
                <div className="cube">
                  <div className="cube-face cube-front" />
                  <div className="cube-face cube-back" />
                  <div className="cube-face cube-right" />
                  <div className="cube-face cube-left" />
                  <div className="cube-face cube-top" />
                  <div className="cube-face cube-bottom" />
                </div>
              </div>
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(activeJob.progress)}%
            </span>
          </div>
        )}

        {/* Hover overlay */}
        {!isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-t from-burnt/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-sepia/10">
        <h3 className="font-display font-semibold text-earth truncate group-hover:text-terracotta transition-colors">
          {name}
        </h3>
        <p className="text-base text-text-muted mt-1 font-manuscript italic">
          {t('gallery.photoCount', { count: photoCount })}
        </p>
      </div>
    </Link>
  );
}

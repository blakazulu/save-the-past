import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MuseumArtifact } from '@/types/museum';

interface MuseumCardProps {
  artifact: MuseumArtifact;
}

export function MuseumCard({ artifact }: MuseumCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'he';

  const ageRange = artifact.infoCard?.estimatedAge?.range?.[lang];
  const material = artifact.infoCard?.material?.[lang];

  return (
    <Link
      to={`/museum/${artifact.id}`}
      className="parchment-card block overflow-hidden transition-all duration-200 hover:shadow-lg group"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-sand/30 relative overflow-hidden">
        {artifact.thumbnailUrl ? (
          <img
            src={artifact.thumbnailUrl}
            alt={artifact.name}
            className="w-full h-full object-cover sepia-light group-hover:filter-none group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sand to-parchment-dark">
            <span className="text-4xl opacity-40">🏛️</span>
          </div>
        )}

        {/* Museum badge */}
        <span className="badge-status badge-complete absolute top-2 right-2">
          {t('museum.public')}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-burnt/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-3 border-t border-sepia/10">
        <h3 className="font-display font-semibold text-earth truncate group-hover:text-terracotta transition-colors">
          {artifact.name}
        </h3>
        {ageRange && (
          <p className="text-sm text-text-secondary truncate">{ageRange}</p>
        )}
        {material && (
          <p className="text-xs text-text-muted truncate mt-0.5">{material}</p>
        )}
        {!artifact.infoCard && (
          <p className="text-xs text-text-muted italic mt-0.5">
            {t('museum.noAnalysis')}
          </p>
        )}
      </div>
    </Link>
  );
}

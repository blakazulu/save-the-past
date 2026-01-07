import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GalleryIcon, SearchIcon } from '@/components/icons';

interface GalleryEmptyProps {
  variant: 'no-artifacts' | 'no-results';
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function GalleryEmpty({ variant, searchQuery, onClearSearch }: GalleryEmptyProps) {
  const { t } = useTranslation();

  if (variant === 'no-results') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sand to-parchment-dark flex items-center justify-center mb-4 border border-sepia/20">
          <SearchIcon className="w-10 h-10 text-earth/50" />
        </div>
        <h2 className="font-display text-lg font-semibold text-earth mb-2">
          {t('gallery.noResults')}
        </h2>
        <p className="text-text-secondary font-manuscript italic mb-4">
          {t('gallery.noResultsDescription', { query: searchQuery })}
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="text-terracotta font-medium hover:text-clay transition-colors"
          >
            {t('gallery.clearSearch')}
          </button>
        )}
      </div>
    );
  }

  // No artifacts variant
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {/* Decorative icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sand/50 to-parchment-dark/30 blur-xl" />
        </div>
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sand to-parchment-dark flex items-center justify-center border border-sepia/20">
          <GalleryIcon className="w-12 h-12 text-earth/50" />
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold text-earth mb-2">
        {t('gallery.empty')}
      </h2>

      <div className="divider-ornate my-4 max-w-[200px]">
        <span className="text-xs">✦</span>
      </div>

      <p className="text-text-secondary font-manuscript italic mb-8 max-w-xs">
        {t('gallery.emptyDescription')}
      </p>

      <Link
        to="/capture"
        className="btn-seal"
      >
        {t('home.cta')}
      </Link>
    </div>
  );
}

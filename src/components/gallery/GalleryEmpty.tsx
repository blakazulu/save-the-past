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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center mb-4">
          <SearchIcon className="w-10 h-10 text-clay" />
        </div>
        <h2 className="text-lg font-semibold text-earth mb-2">
          {t('gallery.noResults')}
        </h2>
        <p className="text-text-secondary mb-4">
          {t('gallery.noResultsDescription', { query: searchQuery })}
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="text-terracotta font-medium hover:text-clay"
          >
            {t('gallery.clearSearch')}
          </button>
        )}
      </div>
    );
  }

  // No artifacts variant
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-sand rounded-full flex items-center justify-center mb-6">
        <GalleryIcon className="w-12 h-12 text-clay" />
      </div>
      <h2 className="text-xl font-semibold text-earth mb-2">
        {t('gallery.empty')}
      </h2>
      <p className="text-text-secondary mb-8">
        {t('gallery.emptyDescription')}
      </p>
      <Link
        to="/capture"
        className="bg-terracotta text-white px-6 py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
      >
        {t('home.cta')}
      </Link>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { SearchIcon, GridIcon, ListIcon, FilterIcon } from '@/components/icons';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'updatedAt' | 'createdAt' | 'name';
export type SortOrder = 'asc' | 'desc';

interface GalleryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterClick: () => void;
  hasActiveFilters?: boolean;
}

export function GalleryToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onFilterClick,
  hasActiveFilters = false,
}: GalleryToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      {/* Search input */}
      <div className="flex-1 relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('gallery.searchPlaceholder')}
          className="input-manuscript w-full pr-4 py-2.5"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Filter button */}
      <button
        onClick={onFilterClick}
        className={`p-2.5 rounded transition-all duration-200 relative ${
          hasActiveFilters
            ? 'bg-terracotta text-parchment-light shadow-md'
            : 'parchment-card text-earth hover:text-terracotta'
        }`}
        aria-label={t('gallery.filters')}
      >
        <FilterIcon className="w-5 h-5" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border-2 border-parchment-light" />
        )}
      </button>

      {/* View mode toggle */}
      <div className="flex parchment-card overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2.5 transition-all duration-200 ${
            viewMode === 'grid'
              ? 'bg-terracotta text-parchment-light'
              : 'text-earth hover:text-terracotta hover:bg-sand/50'
          }`}
          aria-label={t('gallery.viewGrid')}
        >
          <GridIcon className="w-5 h-5" />
        </button>
        <div className="w-px bg-sepia/15" />
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2.5 transition-all duration-200 ${
            viewMode === 'list'
              ? 'bg-terracotta text-parchment-light'
              : 'text-earth hover:text-terracotta hover:bg-sand/50'
          }`}
          aria-label={t('gallery.viewList')}
        >
          <ListIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

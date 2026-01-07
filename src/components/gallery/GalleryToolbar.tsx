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
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('gallery.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-sand rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-terracotta transition-colors"
        />
      </div>

      {/* Filter button */}
      <button
        onClick={onFilterClick}
        className={`p-2.5 rounded-xl border transition-colors relative ${
          hasActiveFilters
            ? 'bg-terracotta text-white border-terracotta'
            : 'bg-white text-earth border-sand hover:border-clay'
        }`}
        aria-label={t('gallery.filters')}
      >
        <FilterIcon className="w-5 h-5" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full" />
        )}
      </button>

      {/* View mode toggle */}
      <div className="flex bg-white border border-sand rounded-xl overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2.5 transition-colors ${
            viewMode === 'grid'
              ? 'bg-terracotta text-white'
              : 'text-earth hover:bg-sand'
          }`}
          aria-label={t('gallery.viewGrid')}
        >
          <GridIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2.5 transition-colors ${
            viewMode === 'list'
              ? 'bg-terracotta text-white'
              : 'text-earth hover:bg-sand'
          }`}
          aria-label={t('gallery.viewList')}
        >
          <ListIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

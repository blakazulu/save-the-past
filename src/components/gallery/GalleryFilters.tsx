import { useTranslation } from 'react-i18next';
import type { ArtifactStatus } from '@/types';
import type { SortBy, SortOrder } from './GalleryToolbar';

interface GalleryFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: ArtifactStatus | 'all';
  onStatusFilterChange: (status: ArtifactStatus | 'all') => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: (ArtifactStatus | 'all')[] = [
  'all',
  'images-captured',
  'processing-3d',
  'processing-info',
  'complete',
  'error',
];

const SORT_OPTIONS: SortBy[] = ['updatedAt', 'createdAt', 'name'];

export function GalleryFilters({
  isOpen,
  onClose,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}: GalleryFiltersProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-burnt/60 z-50 flex items-end md:items-center md:justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-parchment w-full md:w-auto md:min-w-[400px] md:max-w-lg md:rounded-2xl rounded-t-2xl safe-area-bottom max-h-[70vh] overflow-y-auto animate-slide-up md:animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top edge */}
        <div className="h-px bg-gradient-to-r from-transparent via-sepia/40 to-transparent" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-earth flex items-center gap-2">
              <span className="text-terracotta">❧</span>
              {t('gallery.filters')}
            </h3>
            <button
              onClick={onClearFilters}
              className="text-terracotta font-medium hover:text-clay transition-colors text-base"
            >
              {t('gallery.clearFilters')}
            </button>
          </div>

          {/* Status filter */}
          <div className="mb-6">
            <h4 className="text-base font-display font-medium text-text-secondary mb-3 tracking-wide">
              {t('gallery.filterByStatus')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status)}
                  className={`px-3 py-2 rounded text-base transition-all duration-200 ${
                    statusFilter === status
                      ? 'bg-terracotta text-parchment-light shadow-md'
                      : 'parchment-card text-earth hover:bg-sand'
                  }`}
                >
                  {t(`gallery.status.${status}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by */}
          <div className="mb-6">
            <h4 className="text-base font-display font-medium text-text-secondary mb-3 tracking-wide">
              {t('gallery.sortBy')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => onSortByChange(option)}
                  className={`px-3 py-2 rounded text-base transition-all duration-200 ${
                    sortBy === option
                      ? 'bg-terracotta text-parchment-light shadow-md'
                      : 'parchment-card text-earth hover:bg-sand'
                  }`}
                >
                  {t(`gallery.sort.${option}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort order */}
          <div className="mb-6">
            <h4 className="text-base font-display font-medium text-text-secondary mb-3 tracking-wide">
              {t('gallery.sortOrder')}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => onSortOrderChange('desc')}
                className={`flex-1 px-3 py-2 rounded text-base transition-all duration-200 ${
                  sortOrder === 'desc'
                    ? 'bg-terracotta text-parchment-light shadow-md'
                    : 'parchment-card text-earth hover:bg-sand'
                }`}
              >
                {t('gallery.sortDesc')}
              </button>
              <button
                onClick={() => onSortOrderChange('asc')}
                className={`flex-1 px-3 py-2 rounded text-base transition-all duration-200 ${
                  sortOrder === 'asc'
                    ? 'bg-terracotta text-parchment-light shadow-md'
                    : 'parchment-card text-earth hover:bg-sand'
                }`}
              >
                {t('gallery.sortAsc')}
              </button>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={onClose}
            className="btn-seal w-full text-base"
          >
            {t('gallery.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl p-4 safe-area-bottom max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-earth">
            {t('gallery.filters')}
          </h3>
          <button
            onClick={onClearFilters}
            className="text-terracotta font-medium hover:text-clay"
          >
            {t('gallery.clearFilters')}
          </button>
        </div>

        {/* Status filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            {t('gallery.filterByStatus')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => onStatusFilterChange(status)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  statusFilter === status
                    ? 'bg-terracotta text-white'
                    : 'bg-sand text-earth hover:bg-clay hover:text-white'
                }`}
              >
                {t(`gallery.status.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort by */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            {t('gallery.sortBy')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onSortByChange(option)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === option
                    ? 'bg-terracotta text-white'
                    : 'bg-sand text-earth hover:bg-clay hover:text-white'
                }`}
              >
                {t(`gallery.sort.${option}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort order */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            {t('gallery.sortOrder')}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => onSortOrderChange('desc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                sortOrder === 'desc'
                  ? 'bg-terracotta text-white'
                  : 'bg-sand text-earth hover:bg-clay hover:text-white'
              }`}
            >
              {t('gallery.sortDesc')}
            </button>
            <button
              onClick={() => onSortOrderChange('asc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                sortOrder === 'asc'
                  ? 'bg-terracotta text-white'
                  : 'bg-sand text-earth hover:bg-clay hover:text-white'
              }`}
            >
              {t('gallery.sortAsc')}
            </button>
          </div>
        </div>

        {/* Apply button */}
        <button
          onClick={onClose}
          className="w-full bg-terracotta text-white py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
        >
          {t('gallery.applyFilters')}
        </button>
      </div>
    </div>
  );
}

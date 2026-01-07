import { useState, useMemo, useCallback } from 'react';
import type { Artifact, ArtifactStatus } from '@/types';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'updatedAt' | 'createdAt' | 'name';
export type SortOrder = 'asc' | 'desc';

interface UseGalleryFiltersOptions {
  initialViewMode?: ViewMode;
  initialSortBy?: SortBy;
  initialSortOrder?: SortOrder;
}

export function useGalleryFilters(
  artifacts: Artifact[],
  options: UseGalleryFiltersOptions = {}
) {
  const {
    initialViewMode = 'grid',
    initialSortBy = 'updatedAt',
    initialSortOrder = 'desc',
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const hasActiveFilters = statusFilter !== 'all' || searchQuery.length > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialSortBy, initialSortOrder]);

  const filteredAndSortedArtifacts = useMemo(() => {
    let result = [...artifacts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((artifact) => {
        const name = artifact.metadata.name?.toLowerCase() || '';
        const siteName = artifact.metadata.siteName?.toLowerCase() || '';
        const location = artifact.metadata.discoveryLocation?.toLowerCase() || '';
        const tags = artifact.metadata.tags?.join(' ').toLowerCase() || '';

        return (
          name.includes(query) ||
          siteName.includes(query) ||
          location.includes(query) ||
          tags.includes(query)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((artifact) => artifact.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name': {
          const nameA = a.metadata.name || '';
          const nameB = b.metadata.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [artifacts, searchQuery, statusFilter, sortBy, sortOrder]);

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,

    // Computed
    filteredArtifacts: filteredAndSortedArtifacts,
    hasActiveFilters,

    // Actions
    clearFilters,
  };
}

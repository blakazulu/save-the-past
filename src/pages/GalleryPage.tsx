import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/layout';
import {
  GalleryGrid,
  GalleryList,
  GalleryToolbar,
  GalleryFilters,
  GalleryEmpty,
} from '@/components/gallery';
import { useGalleryFilters } from '@/hooks/useGalleryFilters';
import { db } from '@/lib/db';

export default function GalleryPage() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  // Live query for artifacts from IndexedDB
  const artifacts = useLiveQuery(
    () => db.artifacts.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const isLoading = artifacts === undefined;

  const {
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
    filteredArtifacts,
    hasActiveFilters,
    clearFilters,
  } = useGalleryFilters(artifacts || []);

  // No artifacts at all
  if (!isLoading && artifacts?.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title={t('gallery.title')} backTo="/" />
        <GalleryEmpty variant="no-artifacts" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('gallery.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 pb-20">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="mb-4">
            <GalleryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onFilterClick={() => setShowFilters(true)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Content - no skeleton for fast IndexedDB loads to prevent flash */}
          <div className="flex-1">
            {isLoading ? null : filteredArtifacts.length === 0 ? (
              <GalleryEmpty
                variant="no-results"
                searchQuery={searchQuery}
                onClearSearch={clearFilters}
              />
            ) : viewMode === 'grid' ? (
              <GalleryGrid artifacts={filteredArtifacts} />
            ) : (
              <GalleryList artifacts={filteredArtifacts} />
            )}
          </div>
        </div>
      </main>

      {/* Filters panel */}
      <GalleryFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

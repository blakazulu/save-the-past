import { useState, useEffect } from 'react';
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
import { MuseumGrid, MuseumEmpty } from '@/components/museum';
import { DeleteConfirmDialog } from '@/components/data-management/DeleteConfirmDialog';
import { useGalleryFilters } from '@/hooks/useGalleryFilters';
import { db } from '@/lib/db';
import { fetchMuseumArtifacts } from '@/lib/firebase/museumService';
import type { Artifact } from '@/types';
import type { MuseumArtifact } from '@/types/museum';

type TabType = 'my' | 'public';

export default function GalleryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [showFilters, setShowFilters] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<Artifact | null>(null);

  // Museum artifacts state
  const [museumArtifacts, setMuseumArtifacts] = useState<MuseumArtifact[]>([]);
  const [museumLoading, setMuseumLoading] = useState(false);
  const [museumError, setMuseumError] = useState<string | null>(null);

  // Live query for local artifacts from IndexedDB
  const artifacts = useLiveQuery(
    () => db.artifacts.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const isLoading = artifacts === undefined;

  // Fetch museum artifacts when public tab is active
  useEffect(() => {
    if (activeTab !== 'public') return;

    let mounted = true;

    async function loadMuseumArtifacts() {
      try {
        setMuseumLoading(true);
        setMuseumError(null);
        const data = await fetchMuseumArtifacts();
        if (mounted) {
          setMuseumArtifacts(data);
        }
      } catch (err) {
        if (mounted) {
          setMuseumError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setMuseumLoading(false);
        }
      }
    }

    loadMuseumArtifacts();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

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

  // Render content for My Artifacts tab
  const renderMyArtifacts = () => {
    if (isLoading) return null;

    if (artifacts?.length === 0) {
      return <GalleryEmpty variant="no-artifacts" />;
    }

    if (filteredArtifacts.length === 0) {
      return (
        <GalleryEmpty
          variant="no-results"
          searchQuery={searchQuery}
          onClearSearch={clearFilters}
        />
      );
    }

    return viewMode === 'grid' ? (
      <GalleryGrid artifacts={filteredArtifacts} onDelete={setArtifactToDelete} />
    ) : (
      <GalleryList artifacts={filteredArtifacts} onDelete={setArtifactToDelete} />
    );
  };

  // Render content for Public Artifacts tab
  const renderPublicArtifacts = () => {
    if (museumLoading) {
      return <MuseumEmpty variant="loading" />;
    }

    if (museumError) {
      return <MuseumEmpty variant="error" error={museumError} />;
    }

    if (museumArtifacts.length === 0) {
      return <MuseumEmpty variant="no-artifacts" />;
    }

    return <MuseumGrid artifacts={museumArtifacts} />;
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('gallery.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 pb-20">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-terracotta text-sand'
                  : 'bg-sand text-text-secondary hover:bg-clay/10'
              }`}
            >
              {t('gallery.tabs.my', 'My Artifacts')}
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'public'
                  ? 'bg-terracotta text-sand'
                  : 'bg-sand text-text-secondary hover:bg-clay/10'
              }`}
            >
              {t('gallery.tabs.public', 'Public Artifacts')}
            </button>
          </div>

          {/* Toolbar - only show for My Artifacts tab */}
          {activeTab === 'my' && (
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
          )}

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'my' ? renderMyArtifacts() : renderPublicArtifacts()}
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

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={!!artifactToDelete}
        onClose={() => setArtifactToDelete(null)}
        artifacts={artifactToDelete ? [artifactToDelete] : []}
        onDeleted={() => setArtifactToDelete(null)}
      />
    </div>
  );
}

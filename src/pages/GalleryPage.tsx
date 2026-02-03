import { useState, useEffect, useRef, useCallback } from 'react';
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
import { db, optimizeAllExistingModels } from '@/lib/db';
import { fetchMuseumArtifacts, deleteMuseumArtifact, batchDeleteMuseumArtifacts } from '@/lib/firebase/museumService';
import { confirmAdminAction, logAdminAction } from '@/lib/auth/adminCheck';
import { logger } from '@/lib/utils/logger';
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

  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [myMuseumArtifacts, setMyMuseumArtifacts] = useState<MuseumArtifact[]>([]);
  const [localModelSizes, setLocalModelSizes] = useState<Map<string, number>>(new Map());
  const [isLoadingMyArtifacts, setIsLoadingMyArtifacts] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({ current: 0, total: 0 });
  const [optimizationStats, setOptimizationStats] = useState<string | null>(null);
  const [optimizationLog, setOptimizationLog] = useState<Array<{
    modelId: string;
    originalSize: number;
    newSize: number;
    saved: number;
  }>>([]);
  const keySequenceRef = useRef<string[]>([]);
  const keyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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


  // Triple-z key press detector
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only track 'z' key
      if (e.key.toLowerCase() !== 'z') return;

      // Clear timeout
      if (keyTimeoutRef.current) {
        clearTimeout(keyTimeoutRef.current);
      }

      // Add to sequence
      keySequenceRef.current.push('z');
      logger.debug('🔑 Key pressed:', keySequenceRef.current.length, '/', 3);

      // Keep only last 3 keys
      if (keySequenceRef.current.length > 3) {
        keySequenceRef.current.shift();
      }

      // Check for triple-z
      if (keySequenceRef.current.length === 3 &&
          keySequenceRef.current.every(k => k === 'z')) {
        logger.debug('🔓 Debug mode activated');
        setShowDebugModal(true);
        keySequenceRef.current = [];
      }

      // Reset sequence after 1 second of inactivity
      keyTimeoutRef.current = setTimeout(() => {
        logger.debug('⏱️ Key sequence reset');
        keySequenceRef.current = [];
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (keyTimeoutRef.current) {
        clearTimeout(keyTimeoutRef.current);
      }
    };
  }, []);

  // Load museum artifacts function (defined before useEffect uses it)
  const loadMyMuseumArtifacts = useCallback(async () => {
    setIsLoadingMyArtifacts(true);
    try {
      // Load ALL museum artifacts (admin mode) - includes modelSize from Firebase
      const allArtifacts = await fetchMuseumArtifacts(200);
      setMyMuseumArtifacts(allArtifacts);

      logger.debug('🔍 Loading museum artifacts...');
      logger.debug('Museum artifacts count:', allArtifacts.length);
      logger.debug('Artifacts with models:', allArtifacts.filter(a => a.modelUrl).length);
      logger.debug('Artifacts with model sizes:', allArtifacts.filter(a => a.modelSize).length);

      // Also load local model sizes as fallback for artifacts without Firebase size
      const allLocalArtifacts = await db.artifacts.toArray();
      const modelSizeMap = new Map<string, number>();

      for (const localArtifact of allLocalArtifacts) {
        if (localArtifact.model3DId) {
          const model = await db.models.get(localArtifact.model3DId);
          if (model) {
            modelSizeMap.set(localArtifact.id, model.blob.size);
          }
        }
      }

      setLocalModelSizes(modelSizeMap);
    } catch (error) {
      logger.error('Failed to load artifacts:', error);
    } finally {
      setIsLoadingMyArtifacts(false);
    }
  }, []);

  // Load museum artifacts when modal opens
  useEffect(() => {
    if (showDebugModal) {
      loadMyMuseumArtifacts();
    }
  }, [showDebugModal, loadMyMuseumArtifacts]);

  const handleDeleteArtifact = async (artifactId: string) => {
    const artifact = myMuseumArtifacts.find(a => a.id === artifactId);
    if (!artifact) return;

    // Require strong confirmation for admin action
    if (!confirmAdminAction(`Delete artifact "${artifact.name}"`, 1)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMuseumArtifact(artifactId);

      // Log admin action for audit trail
      logAdminAction('delete_museum_artifact', {
        artifactId,
        artifactName: artifact.name,
        deviceId: artifact.deviceId,
      });

      setMyMuseumArtifacts(prev => prev.filter(a => a.id !== artifactId));
      // Also refresh the public artifacts list if we're on that tab
      if (activeTab === 'public') {
        setMuseumArtifacts(prev => prev.filter(a => a.id !== artifactId));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to delete artifact: ' + errorMessage);

      // Log failed attempt
      logAdminAction('delete_museum_artifact_failed', {
        artifactId,
        artifactName: artifact.name,
        error: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const totalCount = myMuseumArtifacts.length;

    // Require strong confirmation for mass deletion
    if (!confirmAdminAction(`Delete ALL artifacts from the entire museum (${totalCount} artifacts from ALL users)`, totalCount)) {
      return;
    }

    setIsDeleting(true);
    setDeleteProgress({ current: 0, total: totalCount });
    let deletedCount = 0;

    try {
      // Use batch delete for better performance
      const artifactIds = myMuseumArtifacts.map(a => a.id);
      const results = await batchDeleteMuseumArtifacts(artifactIds, (current, total) => {
        setDeleteProgress({ current, total });
      });

      deletedCount = results.deleted;
      const failedDeletions = results.errors.map(e => {
        const artifact = myMuseumArtifacts.find(a => a.id === e.id);
        return {
          id: e.id,
          name: artifact?.name || 'Unknown',
          error: e.error,
        };
      });

      // Log admin action
      logAdminAction('delete_all_museum_artifacts', {
        totalCount,
        deletedCount,
        failedCount: failedDeletions.length,
        failures: failedDeletions,
      });

      // Show results
      if (failedDeletions.length === 0) {
        alert(`✅ Successfully deleted all ${deletedCount} artifacts from the museum`);
      } else {
        alert(
          `⚠️ Deleted ${deletedCount} of ${totalCount} artifacts\n\n` +
          `Failed to delete ${failedDeletions.length} artifacts:\n` +
          failedDeletions.map(f => `- ${f.name}: ${f.error}`).join('\n')
        );
      }

      setMyMuseumArtifacts([]);
      // Refresh the public artifacts list
      if (activeTab === 'public') {
        setMuseumArtifacts([]);
      }
      setShowDebugModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to delete artifacts: ' + errorMessage);

      // Log failed attempt
      logAdminAction('delete_all_museum_artifacts_failed', {
        totalCount,
        deletedCount,
        error: errorMessage,
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const handleOptimizeLocalModels = async () => {
    if (!confirm('Optimize all GLB models in local database?\n\nThis will:\n- Reduce model file sizes by 50-70%\n- Update models in place (same IDs)\n- Not trigger re-uploads\n\nContinue?')) {
      return;
    }

    setIsOptimizing(true);
    setOptimizationStats(null);
    setOptimizationLog([]);
    setOptimizationProgress({ current: 0, total: 0 });

    try {
      const stats = await optimizeAllExistingModels((current, total, modelId, saved, originalSize, newSize) => {
        setOptimizationProgress({ current, total });

        // Add to log
        setOptimizationLog(prev => [...prev, {
          modelId,
          originalSize,
          newSize,
          saved,
        }]);

        logger.log(`Optimizing ${current}/${total}: ${modelId} ${(originalSize / 1024).toFixed(1)} KB → ${(newSize / 1024).toFixed(1)} KB (saved ${(saved / 1024).toFixed(1)} KB)`);
      });

      const totalSavedMB = (stats.totalSaved / (1024 * 1024)).toFixed(2);
      let message = `Optimized: ${stats.optimized} models\n` +
        `Skipped: ${stats.skipped} (not GLB or already optimized)\n` +
        `Failed: ${stats.failed}\n` +
        `Total saved: ${totalSavedMB} MB`;

      // Add detailed failure information if any
      if (stats.failed > 0 && stats.failures.length > 0) {
        message += '\n\nFailed Models:\n';
        message += stats.failures
          .slice(0, 5) // Show first 5 failures
          .map(f => `- ${f.modelId.substring(0, 8)}...: ${f.error}${f.phase ? ` (${f.phase})` : ''}`)
          .join('\n');
        if (stats.failures.length > 5) {
          message += `\n... and ${stats.failures.length - 5} more`;
        }
      }

      const icon = stats.failed > 0 ? '⚠️' : stats.optimized === 0 ? 'ℹ️' : '✅';
      const title = stats.failed > 0 ? 'Optimization completed with errors' :
                    stats.optimized === 0 ? 'No optimization needed' :
                    'Optimization complete!';

      setOptimizationStats(`${icon} ${title}\n\n${message}`);
      alert(`${icon} ${title}\n\n${message}`);
    } catch (error) {
      const errorMsg = 'Failed to optimize models: ' + (error instanceof Error ? error.message : 'Unknown error');
      setOptimizationStats(`❌ ${errorMsg}`);
      alert(errorMsg);
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress({ current: 0, total: 0 });
    }
  };

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

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDebugModal(false)}>
          <div className="bg-sand rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-sepia/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-earth">🔧 Debug Tools</h3>
                  <p className="text-sm text-text-secondary">Optimize local models & manage museum uploads</p>
                </div>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="p-2 hover:bg-clay/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Local Models Optimization Section */}
              <div className="mb-6 p-4 bg-info/5 border border-info/20 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-earth mb-1">Optimize Local Models</h4>
                    <p className="text-sm text-text-secondary mb-3">
                      Reduce storage usage by optimizing all GLB models in your local database (50-70% size reduction).
                      Models are updated in place - IDs stay the same.
                    </p>
                    <button
                      onClick={handleOptimizeLocalModels}
                      disabled={isOptimizing}
                      className="px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-clay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOptimizing
                        ? `Optimizing... ${optimizationProgress.current}/${optimizationProgress.total}`
                        : 'Optimize All Models'
                      }
                    </button>

                    {/* Optimization Log - Real-time */}
                    {optimizationLog.length > 0 && (
                      <div className="mt-3 max-h-48 overflow-y-auto bg-white border border-sand rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-sand/30 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-semibold text-text-secondary">Model ID</th>
                              <th className="text-right p-2 font-semibold text-text-secondary">Original</th>
                              <th className="text-center p-2 font-semibold text-text-secondary">→</th>
                              <th className="text-right p-2 font-semibold text-text-secondary">New</th>
                              <th className="text-right p-2 font-semibold text-text-secondary">Saved</th>
                            </tr>
                          </thead>
                          <tbody>
                            {optimizationLog.map((log, idx) => {
                              const percentSaved = ((log.saved / log.originalSize) * 100).toFixed(1);
                              return (
                                <tr key={idx} className="border-t border-sand">
                                  <td className="p-2 font-mono text-text-muted truncate max-w-[120px]" title={log.modelId}>
                                    {log.modelId.substring(0, 8)}...
                                  </td>
                                  <td className="p-2 text-right text-text-secondary">
                                    {(log.originalSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="p-2 text-center text-success">→</td>
                                  <td className="p-2 text-right text-earth font-semibold">
                                    {(log.newSize / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="p-2 text-right text-success font-semibold">
                                    -{(log.saved / 1024).toFixed(1)} KB ({percentSaved}%)
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Final Summary */}
                    {optimizationStats && (
                      <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded text-xs text-success whitespace-pre-line">
                        {optimizationStats}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-sepia/10 mb-4" />

              {/* Museum Artifacts Section */}
              {isLoadingMyArtifacts ? (
                <div className="text-center py-8 text-text-secondary">Loading...</div>
              ) : myMuseumArtifacts.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>No artifacts found in museum</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-earth">All Museum Artifacts</h4>
                      <span className="px-2 py-0.5 bg-error/20 text-error text-xs font-bold rounded">ADMIN MODE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary">
                        {myMuseumArtifacts.length} artifact{myMuseumArtifacts.length !== 1 ? 's' : ''} in Firebase
                      </p>
                      <button
                        onClick={handleDeleteAll}
                        disabled={isDeleting}
                        className="px-3 py-1.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
                      >
                        {isDeleting
                          ? `Deleting... ${deleteProgress.current}/${deleteProgress.total}`
                          : 'Delete All'
                        }
                      </button>
                    </div>
                  </div>

                  {myMuseumArtifacts.map((artifact) => {
                    const myDeviceId = localStorage.getItem('save-the-past-device-id');
                    const isMyArtifact = artifact.deviceId === myDeviceId;
                    // Prefer Firebase model size, fallback to local
                    const modelSize = artifact.modelSize || localModelSizes.get(artifact.localArtifactId);

                    return (
                      <div key={artifact.id} className={`bg-white rounded-lg p-3 border ${isMyArtifact ? 'border-terracotta/50' : 'border-sand'} flex items-center gap-3`}>
                        {/* Thumbnail */}
                        {artifact.thumbnailUrl && (
                          <img
                            src={artifact.thumbnailUrl}
                            alt={artifact.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-earth truncate">{artifact.name}</h4>
                            {isMyArtifact && (
                              <span className="px-1.5 py-0.5 bg-terracotta/20 text-terracotta text-xs font-medium rounded flex-shrink-0">
                                Mine
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary truncate">
                            {artifact.siteName || artifact.discoveryLocation || 'Unknown location'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-text-muted">
                              {artifact.createdAt.toLocaleDateString()}
                            </p>
                            {artifact.modelUrl && (
                              <span className="text-xs text-info flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                3D
                              </span>
                            )}
                            {modelSize && (
                              <span className="text-xs text-success font-medium">
                                {(modelSize / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteArtifact(artifact.id)}
                          disabled={isDeleting}
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Delete from museum"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sepia/20 bg-parchment-light/30">
              <p className="text-xs text-text-muted text-center">
                <strong>Model Optimization:</strong> Updates local IndexedDB models in place (IDs preserved).<br />
                <strong>Museum Deletion:</strong> Removes artifacts from Firebase Storage & Firestore only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

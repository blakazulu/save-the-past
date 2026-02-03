import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { fetchMuseumArtifacts, deleteMuseumArtifact, batchDeleteMuseumArtifacts } from '@/lib/firebase/museumService';
import { optimizeAllExistingModels, db } from '@/lib/db';
import { confirmAdminAction, logAdminAction } from '@/lib/auth/adminCheck';
import { logger } from '@/lib/utils/logger';
import type { MuseumArtifact } from '@/types/museum';

export default function MuseumPage() {
  const { t } = useTranslation();
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [myArtifacts, setMyArtifacts] = useState<MuseumArtifact[]>([]);
  const [localModelSizes, setLocalModelSizes] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
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

  const loadMyArtifacts = async () => {
    setIsLoading(true);
    try {
      // Load ALL museum artifacts (admin mode)
      const allArtifacts = await fetchMuseumArtifacts(200);
      setMyArtifacts(allArtifacts);

      // Load local model sizes for all artifacts
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
      setIsLoading(false);
    }
  };

  // Load museum artifacts when modal opens
  useEffect(() => {
    if (showDebugModal) {
      loadMyArtifacts();
    }
  }, [showDebugModal]);

  const handleDeleteArtifact = async (artifactId: string) => {
    const artifact = myArtifacts.find(a => a.id === artifactId);
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

      setMyArtifacts(prev => prev.filter(a => a.id !== artifactId));
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
    const totalCount = myArtifacts.length;

    // Require strong confirmation for mass deletion
    if (!confirmAdminAction(`Delete ALL artifacts from the entire museum (${totalCount} artifacts from ALL users)`, totalCount)) {
      return;
    }

    setIsDeleting(true);
    setDeleteProgress({ current: 0, total: totalCount });
    let deletedCount = 0;

    try {
      // Use batch delete for better performance
      const artifactIds = myArtifacts.map(a => a.id);
      const results = await batchDeleteMuseumArtifacts(artifactIds, (current, total) => {
        setDeleteProgress({ current, total });
      });

      deletedCount = results.deleted;

      // Log admin action
      logAdminAction('delete_all_museum_artifacts', {
        totalCount,
        deletedCount,
      });

      alert(`✅ Successfully deleted ${deletedCount} artifacts from the museum`);
      setMyArtifacts([]);
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

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('museum.title')} backTo="/" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <div className="max-w-md w-full text-center">
          {/* Museum Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-terracotta/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-earth mb-3">
            {t('museum.virtualMuseum', 'Virtual Museum')}
          </h2>

          {/* Description */}
          <p className="text-text-secondary mb-8 leading-relaxed">
            {t('museum.heroDescription', 'Explore artifacts in an immersive 3D museum environment. Walk through galleries and discover archaeological treasures from around the world.')}
          </p>

          {/* Big Enter Button */}
          <Link
            to="/virtual-tour"
            className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-terracotta hover:bg-clay text-sand text-lg font-semibold rounded-xl transition-colors shadow-lg"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('virtualTour.enterTour', 'Enter Virtual Tour')}
          </Link>

          {/* Hint */}
          <p className="text-sm text-text-secondary mt-4">
            {t('museum.tourHint', 'Best experienced on desktop with keyboard and mouse')}
          </p>
        </div>
      </main>

      {/* Debug Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDebugModal(false)}>
          <div className="bg-sand rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-sepia/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-earth">🔧 Debug: Museum Cleanup</h3>
                  <p className="text-sm text-text-secondary">Manage your uploaded artifacts</p>
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
              {isLoading ? (
                <div className="text-center py-8 text-text-secondary">Loading...</div>
              ) : myArtifacts.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>No artifacts found from this device</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4">
                    <h4 className="font-semibold text-earth mb-2">Museum Artifacts from This Device</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary">
                        Found {myArtifacts.length} artifact{myArtifacts.length !== 1 ? 's' : ''} uploaded to Firebase
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

                  {myArtifacts.map((artifact) => {
                    const isMyArtifact = artifact.deviceId === localStorage.getItem('save-the-past-device-id');
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
                        title="Delete"
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

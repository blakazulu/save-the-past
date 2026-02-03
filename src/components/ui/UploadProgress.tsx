import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadStore } from '@/stores';
import { retryFailedUploads } from '@/lib/firebase/uploadQueue';
import { CollapseIcon, MuseumIcon, RefreshIcon } from '@/components/icons';
import { logger } from '@/lib/utils/logger';

export function UploadProgress() {
  const { t } = useTranslation();
  const { uploads, isVisible, setVisible, clearCompleted } = useUploadStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const pending = uploads.filter((u) => u.status === 'pending').length;
  const uploading = uploads.filter((u) => u.status === 'uploading' || u.status === 'optimizing').length;
  const completed = uploads.filter((u) => u.status === 'completed').length;
  const failed = uploads.filter((u) => u.status === 'failed').length;
  const total = uploads.length;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = completed + failed === total && total > 0;
  const hasFailures = failed > 0;

  // Auto-hide after all uploads complete (only if no failures)
  useEffect(() => {
    if (uploads.length > 0 && uploads.every((u) => u.status === 'completed')) {
      const timer = setTimeout(() => {
        clearCompleted();
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploads, clearCompleted, setVisible]);

  // Auto-expand when there are failures
  useEffect(() => {
    if (hasFailures) {
      setIsExpanded(true);
    }
  }, [hasFailures]);

  const handleRetry = async () => {
    if (!navigator.onLine) {
      logger.warn('[Museum Upload] Cannot retry while offline');
      return;
    }
    setIsRetrying(true);
    try {
      // Retry all failed uploads in the database queue
      // The queue processor will update UI state via store.updateUpload()
      await retryFailedUploads();
    } catch (err) {
      logger.error('Failed to retry uploads:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    if (hasFailures) {
      // Keep failed items but hide the panel
      setVisible(false);
    } else {
      clearCompleted();
      setVisible(false);
    }
  };

  if (!isVisible || uploads.length === 0) return null;

  const failedUploads = uploads.filter((u) => u.status === 'failed');
  const activeUploads = uploads.filter((u) => u.status !== 'failed' && u.status !== 'completed');

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className={`parchment-card p-4 shadow-lg border ${hasFailures ? 'border-error/50' : 'border-sepia/30'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MuseumIcon className={`w-5 h-5 ${hasFailures ? 'text-error' : 'text-terracotta'}`} />
            <span className="font-semibold text-earth">
              {t('upload.title', 'Museum Upload')}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-sepia/10 rounded-full transition-colors"
            aria-label={t('common.close', 'Close')}
          >
            <CollapseIcon className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-sepia/20 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              hasFailures ? 'bg-error' : isAllDone ? 'bg-success' : 'bg-terracotta'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="text-sm text-text-secondary">
          {uploading > 0 && (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-terracotta rounded-full animate-pulse" />
              {t('upload.uploading', 'Uploading {{count}} artifact(s)...', { count: uploading + pending })}
            </span>
          )}
          {uploading === 0 && pending > 0 && (
            <span>{t('upload.pending', '{{count}} artifact(s) pending', { count: pending })}</span>
          )}
          {isAllDone && failed === 0 && (
            <span className="text-success">
              {t('upload.complete', 'All {{count}} artifact(s) uploaded!', { count: completed })}
            </span>
          )}
          {hasFailures && (
            <span className="text-error">
              {t('upload.failedCount', '{{failed}} upload(s) failed', { failed })}
            </span>
          )}
        </div>

        {/* Failed uploads with error details */}
        {hasFailures && isExpanded && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-error">
              {t('upload.errorDetails', 'Error details:')}
            </div>
            {failedUploads.map((upload) => (
              <div
                key={upload.artifactId}
                className="bg-error/10 rounded-lg p-2 text-xs"
              >
                <div className="font-medium text-error truncate">{upload.artifactName}</div>
                {upload.error && (
                  <div className="text-text-muted mt-1 break-words">
                    {upload.error}
                  </div>
                )}
              </div>
            ))}

            {/* Retry button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full mt-2 py-2 px-3 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-clay transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshIcon className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying
                ? t('upload.retrying', 'Retrying...')
                : t('upload.retry', 'Retry Failed Uploads')}
            </button>
          </div>
        )}

        {/* Active uploads (show when not too many and not showing failures) */}
        {!hasFailures && activeUploads.length > 0 && activeUploads.length <= 3 && (
          <div className="mt-3 space-y-1 text-xs">
            {activeUploads.map((upload) => (
              <div
                key={upload.artifactId}
                className="flex items-center justify-between text-text-muted"
              >
                <span className="truncate flex-1">{upload.artifactName}</span>
                <span
                  className={`ml-2 ${
                    upload.status === 'completed'
                      ? 'text-success'
                      : upload.status === 'optimizing'
                      ? 'text-amber'
                      : 'text-terracotta'
                  }`}
                >
                  {upload.status === 'pending' && t('upload.status.pending', 'Pending')}
                  {upload.status === 'optimizing' && t('upload.status.optimizing', 'Optimizing...')}
                  {upload.status === 'uploading' && t('upload.status.uploading', 'Uploading...')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Toggle expand for failures */}
        {hasFailures && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 text-xs text-text-muted hover:text-earth transition-colors"
          >
            {isExpanded
              ? t('upload.hideDetails', 'Hide details')
              : t('upload.showDetails', 'Show details')}
          </button>
        )}
      </div>
    </div>
  );
}

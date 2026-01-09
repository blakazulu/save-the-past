import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadStore } from '@/stores';
import { CollapseIcon, MuseumIcon } from '@/components/icons';

export function UploadProgress() {
  const { t } = useTranslation();
  const { uploads, isVisible, setVisible, clearCompleted } = useUploadStore();

  // Auto-hide after all uploads complete
  useEffect(() => {
    if (uploads.length > 0 && uploads.every((u) => u.status === 'completed')) {
      const timer = setTimeout(() => {
        clearCompleted();
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploads, clearCompleted, setVisible]);

  if (!isVisible || uploads.length === 0) return null;

  const pending = uploads.filter((u) => u.status === 'pending').length;
  const uploading = uploads.filter((u) => u.status === 'uploading' || u.status === 'optimizing').length;
  const completed = uploads.filter((u) => u.status === 'completed').length;
  const failed = uploads.filter((u) => u.status === 'failed').length;
  const total = uploads.length;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = completed + failed === total;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="parchment-card p-4 shadow-lg border border-sepia/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MuseumIcon className="w-5 h-5 text-terracotta" />
            <span className="font-semibold text-earth">
              {t('upload.title', 'Museum Upload')}
            </span>
          </div>
          <button
            onClick={() => {
              clearCompleted();
              setVisible(false);
            }}
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
              failed > 0 ? 'bg-error' : isAllDone ? 'bg-success' : 'bg-terracotta'
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
          {isAllDone && failed > 0 && (
            <span className="text-error">
              {t('upload.failed', '{{failed}} of {{total}} failed', { failed, total })}
            </span>
          )}
        </div>

        {/* Individual items (collapsed by default, show if few items) */}
        {uploads.length <= 3 && (
          <div className="mt-3 space-y-1 text-xs">
            {uploads.map((upload) => (
              <div
                key={upload.artifactId}
                className="flex items-center justify-between text-text-muted"
              >
                <span className="truncate flex-1">{upload.artifactName}</span>
                <span
                  className={`ml-2 ${
                    upload.status === 'completed'
                      ? 'text-success'
                      : upload.status === 'failed'
                      ? 'text-error'
                      : upload.status === 'optimizing'
                      ? 'text-amber'
                      : 'text-terracotta'
                  }`}
                >
                  {upload.status === 'pending' && t('upload.status.pending', 'Pending')}
                  {upload.status === 'optimizing' && t('upload.status.optimizing', 'Optimizing...')}
                  {upload.status === 'uploading' && t('upload.status.uploading', 'Uploading...')}
                  {upload.status === 'completed' && t('upload.status.completed', 'Done')}
                  {upload.status === 'failed' && t('upload.status.failed', 'Failed')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

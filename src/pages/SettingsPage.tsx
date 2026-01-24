import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';
import { CheckIcon, DownloadIcon, UploadIcon, TrashIcon, MuseumIcon, RefreshIcon, WarningIcon } from '@/components/icons';
import { ExportDialog, ImportDialog, DeleteConfirmDialog } from '@/components/data-management';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { migrateExistingArtifacts, retryFailedUploads, forceResyncAllArtifacts } from '@/lib/firebase/uploadQueue';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isForceResyncing, setIsForceResyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const artifacts = useLiveQuery(() => db.artifacts.toArray());
  const pendingUploads = useLiveQuery(() => db.pendingUploads.toArray());

  // Count artifacts that need syncing
  const completedArtifacts = artifacts?.filter(a => a.status === 'complete') || [];
  const notUploadedCount = completedArtifacts.filter(a => !a.uploadedToMuseum).length;
  const pendingCount = pendingUploads?.filter(u => u.status === 'pending').length || 0;
  const failedCount = pendingUploads?.filter(u => u.status === 'failed').length || 0;
  const uploadingCount = pendingUploads?.filter(u => u.status === 'uploading').length || 0;

  const handleSyncToMuseum = async () => {
    if (!navigator.onLine) {
      setSyncResult({
        type: 'error',
        message: t('settings.museum.offline', 'You are offline. Please connect to the internet and try again.')
      });
      return;
    }
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const count = await migrateExistingArtifacts();
      setSyncResult({
        type: 'success',
        message: count > 0
          ? t('settings.museum.syncQueued', 'Queued {{count}} artifact(s) for upload', { count })
          : t('settings.museum.allSynced', 'All artifacts are already synced')
      });
    } catch (err) {
      setSyncResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!navigator.onLine) {
      setSyncResult({
        type: 'error',
        message: t('settings.museum.offline', 'You are offline. Please connect to the internet and try again.')
      });
      return;
    }
    setIsRetrying(true);
    setSyncResult(null);
    try {
      await retryFailedUploads();
      setSyncResult({
        type: 'success',
        message: t('settings.museum.retryStarted', 'Retrying failed uploads...')
      });
    } catch (err) {
      setSyncResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleForceResync = async () => {
    if (!navigator.onLine) {
      setSyncResult({
        type: 'error',
        message: t('settings.museum.offline', 'You are offline. Please connect to the internet and try again.')
      });
      return;
    }
    if (!confirm(t('settings.museum.forceResyncConfirm', 'This will re-upload all your artifacts to the museum. Continue?'))) {
      return;
    }
    setIsForceResyncing(true);
    setSyncResult(null);
    try {
      const count = await forceResyncAllArtifacts();
      setSyncResult({
        type: 'success',
        message: t('settings.museum.forceResyncQueued', 'Queued {{count}} artifact(s) for re-upload', { count })
      });
    } catch (err) {
      setSyncResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsForceResyncing(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Use resolvedLanguage for accurate comparison (handles 'en-US' -> 'en')
  const currentLang = i18n.resolvedLanguage || i18n.language;

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('settings.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Language Setting */}
          <section className="parchment-card p-5">
            <h2 className="font-display text-lg font-semibold text-earth mb-4 flex items-center gap-2">
              <span className="text-terracotta">❧</span>
              {t('settings.language')}
            </h2>
            <div className="space-y-2">
              <LanguageOption
                label={t('settings.english')}
                value="en"
                selected={currentLang === 'en'}
                onChange={changeLanguage}
              />
              <LanguageOption
                label={t('settings.hebrew')}
                value="he"
                selected={currentLang === 'he'}
                onChange={changeLanguage}
              />
            </div>
          </section>

          {/* Museum Sync */}
          <section className="parchment-card p-5">
            <h2 className="font-display text-lg font-semibold text-earth mb-4 flex items-center gap-2">
              <span className="text-terracotta">❧</span>
              {t('settings.museum.title', 'Museum Sync')}
            </h2>

            {/* Status indicators */}
            <div className="mb-4 space-y-2 text-sm">
              {uploadingCount > 0 && (
                <div className="flex items-center gap-2 text-terracotta">
                  <span className="w-2 h-2 bg-terracotta rounded-full animate-pulse" />
                  {t('settings.museum.uploading', 'Uploading {{count}} artifact(s)...', { count: uploadingCount })}
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="w-2 h-2 bg-amber rounded-full" />
                  {t('settings.museum.pending', '{{count}} artifact(s) pending upload', { count: pendingCount })}
                </div>
              )}
              {failedCount > 0 && (
                <div className="flex items-center gap-2 text-error">
                  <WarningIcon className="w-4 h-4" />
                  {t('settings.museum.failed', '{{count}} upload(s) failed', { count: failedCount })}
                </div>
              )}
              {notUploadedCount > 0 && uploadingCount === 0 && pendingCount === 0 && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="w-2 h-2 bg-text-muted rounded-full" />
                  {t('settings.museum.notUploaded', '{{count}} artifact(s) not yet uploaded', { count: notUploadedCount })}
                </div>
              )}
              {notUploadedCount === 0 && failedCount === 0 && pendingCount === 0 && uploadingCount === 0 && completedArtifacts.length > 0 && (
                <div className="flex items-center gap-2 text-success">
                  <CheckIcon className="w-4 h-4" />
                  {t('settings.museum.allSynced', 'All artifacts synced to museum')}
                </div>
              )}
            </div>

            {/* Sync result message */}
            {syncResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                syncResult.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {syncResult.message}
              </div>
            )}

            <div className="space-y-2">
              <DataButton
                icon={<MuseumIcon className="w-5 h-5" />}
                label={isSyncing
                  ? t('settings.museum.syncing', 'Syncing...')
                  : t('settings.museum.syncNow', 'Sync to Museum')}
                onClick={handleSyncToMuseum}
                disabled={isSyncing || notUploadedCount === 0}
                count={notUploadedCount > 0 ? notUploadedCount : undefined}
              />

              {failedCount > 0 && (
                <DataButton
                  icon={<RefreshIcon className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />}
                  label={isRetrying
                    ? t('settings.museum.retrying', 'Retrying...')
                    : t('settings.museum.retryFailed', 'Retry Failed Uploads')}
                  onClick={handleRetryFailed}
                  disabled={isRetrying}
                  count={failedCount}
                />
              )}

              <div className="my-3 border-t border-sepia/15" />

              <DataButton
                icon={<RefreshIcon className={`w-5 h-5 ${isForceResyncing ? 'animate-spin' : ''}`} />}
                label={isForceResyncing
                  ? t('settings.museum.resyncing', 'Re-syncing...')
                  : t('settings.museum.forceResync', 'Force Re-sync All')}
                onClick={handleForceResync}
                disabled={isForceResyncing || completedArtifacts.length === 0}
              />
              <p className="text-xs text-text-muted px-3">
                {t('settings.museum.forceResyncDesc', 'Re-uploads all artifacts to museum (use if museum data was lost)')}
              </p>
            </div>
          </section>

          {/* Data Management */}
          <section className="parchment-card p-5">
            <h2 className="font-display text-lg font-semibold text-earth mb-4 flex items-center gap-2">
              <span className="text-terracotta">❧</span>
              {t('dataManagement.title')}
            </h2>
            <div className="space-y-2">
              <DataButton
                icon={<DownloadIcon className="w-5 h-5" />}
                label={t('dataManagement.export')}
                onClick={() => setShowExport(true)}
                disabled={!artifacts || artifacts.length === 0}
                count={artifacts?.length}
              />

              <DataButton
                icon={<UploadIcon className="w-5 h-5" />}
                label={t('dataManagement.import')}
                onClick={() => setShowImport(true)}
              />

              <div className="my-3 border-t border-sepia/15" />

              <DataButton
                icon={<TrashIcon className="w-5 h-5" />}
                label={t('dataManagement.clearAll')}
                onClick={() => setShowClearAll(true)}
                disabled={!artifacts || artifacts.length === 0}
                danger
              />
            </div>
          </section>

          {/* App Info */}
          <div className="text-center pt-6">
            <div className="inline-block mb-4">
              <img src="/logo-64.png" alt="" className="w-12 h-12 mx-auto opacity-60" />
            </div>
            <p className="font-display text-base text-earth">{t('app.name')}</p>
            <p className="text-md text-text-muted mt-1">v1.0.0</p>
            <p className="font-manuscript text-base text-text-secondary italic mt-2">
              {t('app.tagline')}
            </p>

            {/* Decorative footer */}
            <div className="mt-6 flex items-center justify-center gap-2 text-text-muted">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-sepia/30" />
              <span className="text-md opacity-50">✦</span>
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-sepia/30" />
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} />
      <ImportDialog isOpen={showImport} onClose={() => setShowImport(false)} />
      <DeleteConfirmDialog
        isOpen={showClearAll}
        onClose={() => setShowClearAll(false)}
        artifacts={artifacts || []}
        onDeleted={() => setShowClearAll(false)}
      />
    </div>
  );
}

interface LanguageOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
}

function LanguageOption({ label, value, selected, onChange }: LanguageOptionProps) {
  return (
    <button
      onClick={() => onChange(value)}
      className={`w-full p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${selected
          ? 'bg-terracotta/10 text-earth border border-terracotta/30'
          : 'hover:bg-sand/50 text-text-secondary border border-transparent'
        }`}
    >
      <span className={`font-medium ${selected ? 'font-semibold' : ''}`}>{label}</span>
      {selected && (
        <span className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center animate-stamp">
          <CheckIcon className="w-4 h-4 text-parchment-light" />
        </span>
      )}
    </button>
  );
}

interface DataButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  count?: number;
  danger?: boolean;
}

function DataButton({ icon, label, onClick, disabled, count, danger }: DataButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${danger
          ? 'text-error hover:bg-error/10'
          : 'text-text-primary hover:bg-sand/50'
        }`}
    >
      <span className={danger ? '' : 'text-terracotta'}>{icon}</span>
      <span className="font-medium flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-base text-text-muted">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </button>
  );
}

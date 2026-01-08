import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';
import { CheckIcon, DownloadIcon, UploadIcon, TrashIcon } from '@/components/icons';
import { ExportDialog, ImportDialog, DeleteConfirmDialog } from '@/components/data-management';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);

  const artifacts = useLiveQuery(() => db.artifacts.toArray());

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

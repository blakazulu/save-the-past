import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, BottomNav } from '@/components/layout';
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
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader title={t('settings.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          {/* Language Setting */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-earth mb-4">
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
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-earth mb-4">
              {t('dataManagement.title')}
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowExport(true)}
                disabled={!artifacts || artifacts.length === 0}
                className="w-full p-3 rounded-lg flex items-center gap-3 hover:bg-sand/50 text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-5 h-5 text-terracotta" />
                <span className="font-medium">
                  {t('dataManagement.export')}
                </span>
                {artifacts && artifacts.length > 0 && (
                  <span className="ml-auto text-sm text-text-secondary">
                    {artifacts.length} {t('gallery.status.all').toLowerCase()}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowImport(true)}
                className="w-full p-3 rounded-lg flex items-center gap-3 hover:bg-sand/50 text-text-primary transition-colors"
              >
                <UploadIcon className="w-5 h-5 text-terracotta" />
                <span className="font-medium">
                  {t('dataManagement.import')}
                </span>
              </button>

              <div className="border-t border-sand my-2" />

              <button
                onClick={() => setShowClearAll(true)}
                disabled={!artifacts || artifacts.length === 0}
                className="w-full p-3 rounded-lg flex items-center gap-3 hover:bg-error/10 text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-5 h-5" />
                <span className="font-medium">
                  {t('dataManagement.clearAll')}
                </span>
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center text-sm text-text-secondary pt-4">
            <p>{t('app.name')} v1.0.0</p>
            <p className="mt-1">{t('app.tagline')}</p>
          </div>
        </div>
      </main>

      <BottomNav />

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
      className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
        selected
          ? 'bg-sand text-earth'
          : 'hover:bg-sand/50 text-text-secondary'
      }`}
    >
      <span className="font-medium">{label}</span>
      {selected && <CheckIcon className="w-5 h-5 text-terracotta" />}
    </button>
  );
}

import { useTranslation } from 'react-i18next';
import { PageHeader, BottomNav } from '@/components/layout';
import { CheckIcon } from '@/components/icons';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Use resolvedLanguage for accurate comparison (handles 'en-US' -> 'en')
  const currentLang = i18n.resolvedLanguage || i18n.language;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader title={t('settings.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
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
        </div>
      </main>

      <BottomNav />
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

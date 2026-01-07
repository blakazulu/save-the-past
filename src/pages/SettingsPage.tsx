import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        </div>
      </header>

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
                selected={i18n.language === 'en'}
                onChange={changeLanguage}
              />
              <LanguageOption
                label={t('settings.hebrew')}
                value="he"
                selected={i18n.language === 'he'}
                onChange={changeLanguage}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LanguageOption({
  label,
  value,
  selected,
  onChange,
}: {
  label: string;
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
}) {
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
      {selected && <CheckIcon />}
    </button>
  );
}

function BackIcon() {
  return (
    <svg className="w-6 h-6 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

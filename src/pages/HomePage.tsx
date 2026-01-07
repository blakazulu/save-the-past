import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/layout';
import { SettingsIcon } from '@/components/icons';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <Link
            to="/settings"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={t('nav.settings')}
          >
            <SettingsIcon />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          {/* Logo placeholder */}
          <div className="w-32 h-32 mx-auto mb-6 bg-sand rounded-full flex items-center justify-center">
            <span className="text-4xl">🏺</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-earth mb-3">
            {t('home.title')}
          </h2>

          <p className="text-lg text-terracotta font-medium mb-4">
            {t('home.subtitle')}
          </p>

          <p className="text-text-secondary mb-8">
            {t('home.description')}
          </p>

          <Link
            to="/capture"
            className="inline-block bg-terracotta text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-clay transition-colors shadow-lg"
          >
            {t('home.cta')}
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

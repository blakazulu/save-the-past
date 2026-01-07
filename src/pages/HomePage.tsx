import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/layout';
import { SettingsIcon, CameraIcon, GalleryIcon } from '@/components/icons';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Decorative Header */}
      <header className="safe-area-top relative">
        <div className="absolute inset-0 bg-gradient-to-b from-burnt/20 to-transparent pointer-events-none" />
        <div className="relative px-4 pt-4 pb-2 flex justify-end">
          <Link
            to="/settings"
            className="p-3 rounded-full glass-parchment hover:bg-parchment-light transition-all duration-200 group"
            aria-label={t('nav.settings')}
          >
            <SettingsIcon className="w-5 h-5 text-earth group-hover:text-terracotta transition-colors" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-sm w-full text-center">
          {/* Logo with vintage frame */}
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-sand/50 to-parchment-dark/30 blur-xl" />
            </div>
            <div className="relative">
              <img
                src="/logo-full.png"
                alt={t('app.name')}
                className="md:w-64 w-52 h-auto mx-auto drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title with vintage typography */}
          <div className="space-y-3 mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-earth tracking-wide text-shadow-vintage animate-fade-in-up">
              {t('app.name')}
            </h1>

            <div className="divider-ornate animate-fade-in stagger-1">
              <span className="font-manuscript text-sm">✦</span>
            </div>

            <p className="font-manuscript text-xl text-terracotta italic animate-fade-in-up stagger-2">
              {t('home.subtitle')}
            </p>

            <p className="text-text-secondary leading-relaxed animate-fade-in-up stagger-3">
              {t('home.description')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 animate-fade-in-up stagger-4">
            {/* Primary CTA - Camera */}
            <Link
              to="/capture"
              className="btn-seal w-full flex items-center justify-center gap-3 text-base"
            >
              <CameraIcon className="w-5 h-5" />
              <span>{t('home.cta')}</span>
            </Link>

            {/* Secondary CTA - Gallery */}
            <Link
              to="/gallery"
              className="btn-parchment w-full flex items-center justify-center gap-3 text-base"
            >
              <GalleryIcon className="w-5 h-5" />
              <span>{t('nav.gallery')}</span>
            </Link>
          </div>

          {/* Decorative footer element */}
          <div className="mt-12 animate-fade-in stagger-5">
            <div className="flex items-center justify-center gap-2 text-text-muted text-sm font-manuscript">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-sepia/30" />
              <span className="opacity-50">❧</span>
              <span className="opacity-70">{t('app.tagline')}</span>
              <span className="opacity-50">❧</span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-sepia/30" />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

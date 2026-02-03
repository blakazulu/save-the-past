import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SettingsIcon, CameraIcon, GalleryIcon, PlayIcon, CloseIcon } from '@/components/icons';

export default function HomePage() {
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col">
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
          <div className="relative">
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
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-earth tracking-wide text-shadow-vintage">
              {t('app.name')}
            </h1>

            <div className="divider-ornate">
              <span className="font-manuscript text-base">✦</span>
            </div>

            <p className="font-manuscript text-xl text-terracotta italic">
              {t('home.subtitle')}
            </p>

            <p className="text-text-secondary leading-relaxed">
              {t('home.description')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
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

            {/* Video Demo Button */}
            <button
              onClick={() => setShowVideo(true)}
              className="btn-parchment w-full flex items-center justify-center gap-3 text-base"
            >
              <PlayIcon className="w-5 h-5" />
              <span>{t('home.watchDemo')}</span>
            </button>
          </div>

          {/* Decorative footer element */}
          <div className="mt-12">
            <div className="flex items-center justify-center gap-2 text-text-muted text-base font-manuscript">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-sepia/30" />
              <span className="opacity-50">❧</span>
              <span className="opacity-70">{t('app.tagline')}</span>
              <span className="opacity-50">❧</span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-sepia/30" />
            </div>
          </div>
        </div>
      </main>

      {/* Video Modal - Only renders when showVideo is true for lazy loading */}
      {showVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            {/* Close button */}
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 p-2 rounded-full glass-parchment hover:bg-parchment-light transition-all duration-200 group"
              aria-label={t('home.closeDemo')}
            >
              <CloseIcon className="w-6 h-6 text-sand group-hover:text-terracotta transition-colors" />
            </button>

            {/* Video player */}
            <video
              className="w-full h-full rounded-lg shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            >
              <source src="/PromoVideoAudio.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

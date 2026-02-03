import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout';

export default function MuseumPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('museum.title')} backTo="/" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <div className="max-w-md w-full text-center">
          {/* Museum Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-terracotta/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-earth mb-3">
            {t('museum.virtualMuseum', 'Virtual Museum')}
          </h2>

          {/* Description */}
          <p className="text-text-secondary mb-8 leading-relaxed">
            {t('museum.heroDescription', 'Explore artifacts in an immersive 3D museum environment. Walk through galleries and discover archaeological treasures from around the world.')}
          </p>

          {/* Big Enter Button */}
          <Link
            to="/virtual-tour"
            className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-terracotta hover:bg-clay text-sand text-lg font-semibold rounded-xl transition-colors shadow-lg"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('virtualTour.enterTour', 'Enter Virtual Tour')}
          </Link>

          {/* Hint */}
          <p className="text-sm text-text-secondary mt-4">
            {t('museum.tourHint', 'Best experienced on desktop with keyboard and mouse')}
          </p>
        </div>
      </main>
    </div>
  );
}

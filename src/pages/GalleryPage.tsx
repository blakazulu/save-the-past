import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function GalleryPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold">{t('gallery.title')}</h1>
        </div>
      </header>

      {/* Main Content - Empty State */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-sand rounded-full flex items-center justify-center mb-6">
          <GalleryIcon className="w-12 h-12 text-clay" />
        </div>
        <h2 className="text-xl font-semibold text-earth mb-2">
          {t('gallery.empty')}
        </h2>
        <p className="text-text-secondary mb-8">
          {t('gallery.emptyDescription')}
        </p>
        <Link
          to="/capture"
          className="bg-terracotta text-white px-6 py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
        >
          {t('home.cta')}
        </Link>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="w-6 h-6 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

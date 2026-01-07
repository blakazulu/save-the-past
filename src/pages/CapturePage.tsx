import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CapturePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold">{t('capture.title')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <p className="text-center text-text-secondary mb-8">
            {t('capture.instructions')}
          </p>

          {/* Camera Button */}
          <button className="w-full bg-terracotta text-white p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-clay transition-colors shadow-lg">
            <CameraIcon />
            <span className="text-lg font-semibold">{t('capture.camera')}</span>
          </button>

          {/* Upload Button */}
          <button className="w-full bg-white text-earth border-2 border-sand p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-sand transition-colors">
            <UploadIcon />
            <span className="text-lg font-semibold">{t('capture.upload')}</span>
          </button>
        </div>
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

function CameraIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

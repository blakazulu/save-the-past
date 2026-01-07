import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ArtifactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/gallery" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold">{t('artifact.title')}</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-sand">
        <div className="max-w-4xl mx-auto flex">
          <TabButton active>{t('artifact.tabs.model')}</TabButton>
          <TabButton>{t('artifact.tabs.photos')}</TabButton>
          <TabButton>{t('artifact.tabs.info')}</TabButton>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md">
          <div className="aspect-square bg-sand rounded-2xl flex items-center justify-center mb-4">
            <span className="text-6xl">🏺</span>
          </div>
          <p className="text-text-secondary text-sm">
            Artifact ID: {id}
          </p>
        </div>
      </main>
    </div>
  );
}

function TabButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-terracotta border-b-2 border-terracotta'
          : 'text-text-secondary hover:text-earth'
      }`}
    >
      {children}
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

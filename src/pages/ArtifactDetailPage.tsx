import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';

type TabId = 'model' | 'photos' | 'info';

export default function ArtifactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('model');

  if (!id) {
    return <Navigate to="/gallery" replace />;
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader title={t('artifact.title')} backTo="/gallery" />

      {/* Tabs */}
      <div className="bg-white border-b border-sand">
        <div className="max-w-4xl mx-auto flex">
          <TabButton
            active={activeTab === 'model'}
            onClick={() => setActiveTab('model')}
          >
            {t('artifact.tabs.model')}
          </TabButton>
          <TabButton
            active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
          >
            {t('artifact.tabs.photos')}
          </TabButton>
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
          >
            {t('artifact.tabs.info')}
          </TabButton>
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
          <p className="text-text-secondary text-sm mt-2">
            Active tab: {activeTab}
          </p>
        </div>
      </main>
    </div>
  );
}

interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function TabButton({ children, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
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

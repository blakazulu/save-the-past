import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/layout';
import { Model3DTab, PhotosTab, InfoTab } from '@/components/artifact-detail';
import { CubeIcon, ImageIcon, InfoIcon, TrashIcon } from '@/components/icons';

type TabId = 'model' | 'photos' | 'info';

export default function ArtifactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('model');

  // Load artifact from database
  const artifact = useLiveQuery(
    () => (id ? db.artifacts.get(id) : undefined),
    [id]
  );

  // Show loading state
  if (artifact === undefined) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  // Redirect if artifact not found
  if (!id || artifact === null) {
    return <Navigate to="/gallery" replace />;
  }

  const handleDelete = async () => {
    if (!confirm(t('common.delete') + '?')) return;

    // Delete related data
    await db.images.where('artifactId').equals(id).delete();
    if (artifact.model3DId) {
      await db.models.delete(artifact.model3DId);
    }
    if (artifact.infoCardId) {
      await db.infoCards.delete(artifact.infoCardId);
    }
    await db.artifacts.delete(id);

    navigate('/gallery');
  };

  // Get artifact name for display
  const artifactName = artifact.metadata.name ||
    t('artifact.defaultName', { date: artifact.createdAt.toLocaleDateString() });

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader
        title={artifactName}
        backTo="/gallery"
        action={
          <button
            onClick={handleDelete}
            className="p-2 text-text-secondary hover:text-error rounded-lg"
            aria-label={t('common.delete')}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        }
      />

      {/* Tabs */}
      <div className="bg-white border-b border-sand">
        <div className="max-w-4xl mx-auto flex">
          <TabButton
            active={activeTab === 'model'}
            onClick={() => setActiveTab('model')}
            icon={<CubeIcon className="w-5 h-5" />}
          >
            {t('artifact.tabs.model')}
          </TabButton>
          <TabButton
            active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
            icon={<ImageIcon className="w-5 h-5" />}
            badge={artifact.imageIds.length}
          >
            {t('artifact.tabs.photos')}
          </TabButton>
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            icon={<InfoIcon className="w-5 h-5" />}
            badge={artifact.infoCardId ? '✓' : undefined}
          >
            {t('artifact.tabs.info')}
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'model' && <Model3DTab artifact={artifact} />}
        {activeTab === 'photos' && <PhotosTab artifact={artifact} />}
        {activeTab === 'info' && <InfoTab artifact={artifact} />}
      </main>
    </div>
  );
}

interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
}

function TabButton({ children, active, onClick, icon, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${
        active
          ? 'text-terracotta border-b-2 border-terracotta'
          : 'text-text-secondary hover:text-earth'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
      {badge !== undefined && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full ${
            active
              ? 'bg-terracotta/10 text-terracotta'
              : 'bg-sand text-text-secondary'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

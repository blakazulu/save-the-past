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
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-manuscript text-text-secondary italic">
            {t('common.loading')}
          </p>
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
    <div className="min-h-dvh flex flex-col">
      <PageHeader
        title={artifactName}
        backTo="/gallery"
        action={
          <button
            onClick={handleDelete}
            className="p-2 text-text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors"
            aria-label={t('common.delete')}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        }
      />

      {/* Tabs - Journal style */}
      <div className="relative">
        <div className="glass-parchment border-b border-sepia/20">
          <div className="max-w-4xl mx-auto flex">
            <JournalTab
              active={activeTab === 'model'}
              onClick={() => setActiveTab('model')}
              icon={<CubeIcon className="w-5 h-5" />}
            >
              {t('artifact.tabs.model')}
            </JournalTab>
            <JournalTab
              active={activeTab === 'photos'}
              onClick={() => setActiveTab('photos')}
              icon={<ImageIcon className="w-5 h-5" />}
              badge={artifact.imageIds.length}
            >
              {t('artifact.tabs.photos')}
            </JournalTab>
            <JournalTab
              active={activeTab === 'info'}
              onClick={() => setActiveTab('info')}
              icon={<InfoIcon className="w-5 h-5" />}
              badge={artifact.infoCardId ? '✓' : undefined}
            >
              {t('artifact.tabs.info')}
            </JournalTab>
          </div>
        </div>

        {/* Decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sepia/20 to-transparent" />
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

interface JournalTabProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
}

function JournalTab({ children, active, onClick, icon, badge }: JournalTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 relative ${
        active
          ? 'text-terracotta'
          : 'text-text-muted hover:text-earth'
      }`}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-terracotta rounded-t-full" />
      )}

      {/* Icon */}
      {icon && (
        <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
          {icon}
        </span>
      )}

      {/* Label - hidden on small screens */}
      <span className="hidden sm:inline font-display tracking-wide">{children}</span>

      {/* Badge */}
      {badge !== undefined && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            active
              ? 'bg-terracotta/15 text-terracotta'
              : 'bg-sand text-text-muted'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

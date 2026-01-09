import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { fetchMuseumArtifactById } from '@/lib/firebase/museumService';
import type { MuseumArtifact } from '@/types/museum';

export default function MuseumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [artifact, setArtifact] = useState<MuseumArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'info'>('model');

  const lang = i18n.language as 'en' | 'he';

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    const artifactId = id; // Capture for closure

    async function loadArtifact() {
      try {
        setLoading(true);
        const data = await fetchMuseumArtifactById(artifactId);
        if (mounted) {
          setArtifact(data);
          if (!data) {
            setError('Artifact not found');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArtifact();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title={t('museum.loading')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="cube-container">
            <div className="cube">
              <div className="cube-face cube-front" />
              <div className="cube-face cube-back" />
              <div className="cube-face cube-right" />
              <div className="cube-face cube-left" />
              <div className="cube-face cube-top" />
              <div className="cube-face cube-bottom" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title={t('museum.notFound')} />
        <div className="flex-1 flex items-center justify-center text-text-muted">
          {error || t('museum.artifactNotFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <PageHeader title={artifact.name} />

      {/* Tabs */}
      <div className="flex border-b border-sepia/20 px-4">
        <button
          onClick={() => setActiveTab('model')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'model'
              ? 'text-terracotta border-b-2 border-terracotta'
              : 'text-text-muted hover:text-earth'
          }`}
        >
          {t('artifact.tabs.model')}
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-terracotta border-b-2 border-terracotta'
              : 'text-text-muted hover:text-earth'
          }`}
        >
          {t('artifact.tabs.info')}
        </button>
      </div>

      <main className="flex-1 p-4">
        {activeTab === 'model' && artifact.modelUrl && (
          <div className="parchment-card p-4 h-[60vh] min-h-[400px]">
            <ModelViewer modelUrl={artifact.modelUrl} />
          </div>
        )}

        {activeTab === 'model' && !artifact.modelUrl && (
          <div className="parchment-card p-8 text-center text-text-muted">
            {t('museum.noModel')}
          </div>
        )}

        {activeTab === 'info' && artifact.infoCard && (
          <div className="parchment-card p-6 space-y-6">
            <InfoField
              label={t('infoCard.fields.material')}
              value={artifact.infoCard.material[lang]}
            />
            <InfoField
              label={t('infoCard.fields.estimatedAge')}
              value={artifact.infoCard.estimatedAge.range[lang]}
              badge={artifact.infoCard.estimatedAge.confidence}
            />
            <InfoField
              label={t('infoCard.fields.possibleUse')}
              value={artifact.infoCard.possibleUse[lang]}
            />
            <InfoField
              label={t('infoCard.fields.culturalContext')}
              value={artifact.infoCard.culturalContext[lang]}
            />
            <InfoField
              label={t('infoCard.fields.preservationNotes')}
              value={artifact.infoCard.preservationNotes[lang]}
            />

            {/* Confidence indicator */}
            <div className="pt-4 border-t border-sepia/20">
              <p className="text-xs text-text-muted">
                {t('infoCard.aiDisclaimer')} ({Math.round(artifact.infoCard.aiConfidence * 100)}% {t('infoCard.confidenceLabel').toLowerCase()})
              </p>
            </div>
          </div>
        )}

        {activeTab === 'info' && !artifact.infoCard && (
          <div className="parchment-card p-8 text-center text-text-muted">
            {t('museum.noAnalysis')}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-4 parchment-card p-4">
          <h3 className="font-semibold text-earth mb-3">{t('museum.details')}</h3>
          {artifact.siteName && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">{t('infoCard.metadata.siteName')}:</span> {artifact.siteName}
            </p>
          )}
          {artifact.discoveryLocation && (
            <p className="text-sm text-text-secondary mt-1">
              <span className="font-medium">{t('infoCard.metadata.location')}:</span> {artifact.discoveryLocation}
            </p>
          )}
          <p className="text-xs text-text-muted mt-3">
            {t('museum.uploadedAt')}: {artifact.createdAt.toLocaleDateString()}
          </p>
        </div>
      </main>
    </div>
  );
}

function InfoField({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: 'high' | 'medium' | 'low';
}) {
  const { t } = useTranslation();

  return (
    <div>
      <dt className="text-sm font-semibold text-earth mb-1 flex items-center gap-2">
        {label}
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              badge === 'high'
                ? 'bg-green-100 text-green-700'
                : badge === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {t(`infoCard.confidence.${badge}`)}
          </span>
        )}
      </dt>
      <dd className="text-base text-text-primary">{value}</dd>
    </div>
  );
}

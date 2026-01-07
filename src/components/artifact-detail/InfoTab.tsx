import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  MetadataForm,
  InfoCardGeneration,
  InfoCardDisplay,
  InfoCardEditor,
  InfoCardExport,
} from '@/components/info-card';
import { useGenerateInfoCard } from '@/hooks/useGenerateInfoCard';
import { EditIcon, ShareIcon } from '@/components/icons';
import type { Artifact, InfoCard } from '@/types';

interface InfoTabProps {
  artifact: Artifact;
}

type ViewMode = 'display' | 'edit-metadata' | 'edit-analysis';

export function InfoTab({ artifact }: InfoTabProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('display');
  const [showExport, setShowExport] = useState(false);

  // Load info card if exists
  const infoCard = useLiveQuery(
    () => (artifact.infoCardId ? db.infoCards.get(artifact.infoCardId) : undefined),
    [artifact.infoCardId]
  );

  // Load images for analysis
  const images = useLiveQuery(
    () => db.images.where('artifactId').equals(artifact.id).toArray(),
    [artifact.id]
  );

  // Info card generation hook
  const {
    generate,
    isGenerating,
    progress,
  } = useGenerateInfoCard({
    onComplete: async (newInfoCard: InfoCard) => {
      // Update artifact with info card ID
      await db.artifacts.update(artifact.id, {
        infoCardId: newInfoCard.id,
        status: artifact.model3DId ? 'complete' : 'processing-info',
        updatedAt: new Date(),
      });
    },
  });

  const handleMetadataSave = async (metadata: typeof artifact.metadata) => {
    await db.artifacts.update(artifact.id, {
      metadata,
      updatedAt: new Date(),
    });
    setViewMode('display');
  };

  const handleInfoCardSave = async (updates: Partial<InfoCard>) => {
    if (!artifact.infoCardId) return;

    await db.infoCards.update(artifact.infoCardId, {
      ...updates,
      isHumanEdited: true,
      updatedAt: new Date(),
    });
    setViewMode('display');
  };

  const handleGenerate = async () => {
    if (!images || images.length === 0) return;
    // Use the first image for analysis
    await generate(artifact.id, images[0].blob, artifact.metadata);
  };

  // If editing metadata
  if (viewMode === 'edit-metadata') {
    return (
      <div className="p-4">
        <MetadataForm
          metadata={artifact.metadata}
          onSave={handleMetadataSave}
          onCancel={() => setViewMode('display')}
        />
      </div>
    );
  }

  // If editing info card analysis
  if (viewMode === 'edit-analysis' && infoCard) {
    return (
      <div className="p-4">
        <InfoCardEditor
          infoCard={infoCard}
          onSave={handleInfoCardSave}
          onCancel={() => setViewMode('display')}
        />
      </div>
    );
  }

  // If no info card yet, show generation UI
  if (!infoCard) {
    return (
      <div className="p-4 space-y-6">
        {/* Metadata section */}
        <div className="bg-white rounded-xl p-4 border border-sand">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-earth">
              {t('infoCard.metadata.name')}
            </h3>
            <button
              onClick={() => setViewMode('edit-metadata')}
              className="p-2 text-text-secondary hover:text-terracotta"
            >
              <EditIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <InfoRow
              label={t('infoCard.metadata.name')}
              value={artifact.metadata.name}
            />
            <InfoRow
              label={t('infoCard.metadata.siteName')}
              value={artifact.metadata.siteName}
            />
            <InfoRow
              label={t('infoCard.metadata.location')}
              value={artifact.metadata.discoveryLocation}
            />
            <InfoRow
              label={t('infoCard.metadata.layer')}
              value={artifact.metadata.excavationLayer}
            />
          </div>
        </div>

        {/* Generation UI */}
        <InfoCardGeneration
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          progress={progress}
          hasInfoCard={false}
        />
      </div>
    );
  }

  // Display info card
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metadata section */}
        <div className="bg-white rounded-xl p-4 border border-sand">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-earth text-sm uppercase tracking-wider">
              {t('infoCard.metadata.name')}
            </h3>
            <button
              onClick={() => setViewMode('edit-metadata')}
              className="p-1.5 text-text-secondary hover:text-terracotta rounded-lg hover:bg-sand"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <InfoRow
              label={t('infoCard.metadata.name')}
              value={artifact.metadata.name}
            />
            <InfoRow
              label={t('infoCard.metadata.siteName')}
              value={artifact.metadata.siteName}
            />
            <InfoRow
              label={t('infoCard.metadata.location')}
              value={artifact.metadata.discoveryLocation}
            />
            <InfoRow
              label={t('infoCard.metadata.layer')}
              value={artifact.metadata.excavationLayer}
            />
            {artifact.metadata.notes && (
              <InfoRow
                label={t('infoCard.metadata.notes')}
                value={artifact.metadata.notes}
              />
            )}
            {artifact.metadata.tags && artifact.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {artifact.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-sand text-earth text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        <InfoCardDisplay
          infoCard={infoCard}
          onEdit={() => setViewMode('edit-analysis')}
        />
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t border-sand">
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('edit-analysis')}
            className="flex-1 py-2.5 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors flex items-center justify-center gap-2"
          >
            <EditIcon className="w-4 h-4" />
            {t('infoCard.edit')}
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex-1 py-2.5 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-4 h-4" />
            {t('infoCard.export')}
          </button>
        </div>
      </div>

      {/* Export modal */}
      <InfoCardExport
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        infoCard={infoCard}
        metadata={artifact.metadata}
      />
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value?: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium text-end">{value}</span>
    </div>
  );
}

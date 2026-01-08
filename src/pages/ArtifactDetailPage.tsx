import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/layout';
import { MetadataForm } from '@/components/info-card';
import { MethodSelector } from '@/components/reconstruction/MethodSelector';
import { ReconstructionProgress } from '@/components/reconstruction/ReconstructionProgress';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { InfoCardDisplay } from '@/components/info-card';
import { useReconstruct3D } from '@/hooks/useReconstruct3D';
import { useGenerateInfoCard } from '@/hooks/useGenerateInfoCard';
import { useSettingsStore } from '@/stores/settingsStore';
import { CubeIcon, InfoIcon, TrashIcon } from '@/components/icons';
import type { ArtifactMetadata, Model3D, InfoCard } from '@/types';
import type { ReconstructionMethod } from '@/components/reconstruction/MethodSelector';

type WizardStep = 'metadata' | 'generate';
type TabId = 'model' | 'info';

export default function ArtifactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('metadata');
  const [selectedMethod, setSelectedMethod] = useState<ReconstructionMethod>('single');
  const [activeTab, setActiveTab] = useState<TabId>('model');
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const autoRemoveBackground = useSettingsStore((state) => state.autoRemoveBackground);

  // Load artifact from database
  const artifact = useLiveQuery(
    () => (id ? db.artifacts.get(id) : undefined),
    [id]
  );

  // Load model if exists
  const model = useLiveQuery(
    () => (artifact?.model3DId ? db.models.get(artifact.model3DId) : undefined),
    [artifact?.model3DId]
  );

  // Load info card if exists
  const infoCard = useLiveQuery(
    () => (artifact?.infoCardId ? db.infoCards.get(artifact.infoCardId) : undefined),
    [artifact?.infoCardId]
  );

  // Load images for generation
  const images = useLiveQuery(
    () => (id ? db.images.where('artifactId').equals(id).toArray() : []),
    [id]
  );

  // 3D Reconstruction hook
  const {
    reconstruct,
    status: reconstructStatus,
    progress: reconstructProgress,
    error: reconstructError,
    reset: resetReconstruct,
  } = useReconstruct3D({
    onComplete: async (_newModel: Model3D) => {
      // Model saved, now generate info card
      if (images && images.length > 0 && artifact) {
        await generateInfoCardFn(artifact.id, images[0].blob, artifact.metadata);
      }
    },
  });

  // Info Card generation hook
  const {
    generate: generateInfoCardFn,
    status: infoCardStatus,
    progress: infoCardProgress,
    error: infoCardError,
  } = useGenerateInfoCard({
    onComplete: async (_newInfoCard: InfoCard) => {
      // Both complete
    },
  });

  // Create object URL for model blob
  useEffect(() => {
    if (model?.blob) {
      const url = URL.createObjectURL(model.blob);
      setModelUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setModelUrl(null);
  }, [model]);

  // Don't show loading state for fast IndexedDB queries
  if (artifact === undefined) {
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title="" backTo="/gallery" />
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

  const handleMetadataSave = async (metadata: ArtifactMetadata) => {
    await db.artifacts.update(artifact.id, {
      metadata,
      updatedAt: new Date(),
    });
    setWizardStep('generate');
  };

  const handleGenerate = async () => {
    if (!images || images.length === 0) return;

    const imageBlobs = images.map((img) => img.blob);
    await reconstruct(artifact.id, imageBlobs, selectedMethod, {
      removeBackground: autoRemoveBackground,
    });
  };

  // Get artifact name for display
  const artifactName = artifact.metadata.name ||
    t('artifact.defaultName', { date: artifact.createdAt.toLocaleDateString() });

  // Check if we have a completed model (show result view)
  const hasModel = !!model && !!modelUrl;
  const isProcessing = reconstructStatus === 'uploading' || reconstructStatus === 'processing' || reconstructStatus === 'saving' || infoCardStatus === 'generating';
  const hasError = reconstructStatus === 'error' || infoCardStatus === 'error';

  // Determine current progress status for display
  const getProgressStatus = () => {
    if (reconstructStatus === 'uploading') return 'uploading';
    if (reconstructStatus === 'processing') return 'processing';
    if (reconstructStatus === 'saving') return 'saving';
    if (infoCardStatus === 'generating') return 'processing';
    return 'processing';
  };

  const getProgress = () => {
    if (infoCardStatus === 'generating') {
      // 3D is done (0-70%), info card is generating (70-100%)
      return 70 + (infoCardProgress * 0.3);
    }
    // 3D reconstruction takes 0-70%
    return reconstructProgress * 0.7;
  };

  // RESULT VIEW - Has completed model
  if (hasModel && !isProcessing) {
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

        {/* Tabs */}
        <div className="relative">
          <div className="glass-parchment border-b border-sepia/20">
            <div className="max-w-4xl mx-auto flex">
              <ResultTab
                active={activeTab === 'model'}
                onClick={() => setActiveTab('model')}
                icon={<CubeIcon className="w-5 h-5" />}
              >
                {t('artifact.tabs.model')}
              </ResultTab>
              <ResultTab
                active={activeTab === 'info'}
                onClick={() => setActiveTab('info')}
                icon={<InfoIcon className="w-5 h-5" />}
                badge={infoCard ? '✓' : undefined}
              >
                {t('artifact.tabs.info')}
              </ResultTab>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sepia/20 to-transparent" />
        </div>

        {/* Tab Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'model' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1">
                <ModelViewer modelUrl={modelUrl} className="w-full h-full" />
              </div>
              {model?.metadata?.fileSize && (
                <div className="p-4 bg-white border-t border-sand">
                  <div className="flex items-center justify-between text-base text-text-secondary">
                    <span>{t('reconstruction.complete')}</span>
                    <span>{(model.metadata.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'info' && infoCard && (
            <div className="flex-1 overflow-y-auto p-4">
              <InfoCardDisplay infoCard={infoCard} />
            </div>
          )}
          {activeTab === 'info' && !infoCard && (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-text-secondary">{t('common.loading')}</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // WIZARD VIEW - No model yet
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

      {/* Step Indicator */}
      <div className="px-4 py-3 bg-sand/30">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <StepIndicator
            step={1}
            active={wizardStep === 'metadata'}
            completed={wizardStep === 'generate' || hasModel}
          />
          <div className="flex-1 h-0.5 bg-sand" />
          <StepIndicator
            step={2}
            active={wizardStep === 'generate'}
            completed={hasModel}
          />
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto">
          {/* Step 1: Metadata */}
          {wizardStep === 'metadata' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-earth">
                  {t('wizard.metadataTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {t('wizard.metadataDescription')}
                </p>
              </div>

              <MetadataForm
                metadata={artifact.metadata}
                onSave={handleMetadataSave}
                showCancel={false}
                submitLabel={t('wizard.next')}
              />
            </div>
          )}

          {/* Step 2: Generate */}
          {wizardStep === 'generate' && !isProcessing && !hasError && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-earth">
                  {t('wizard.generateTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {t('wizard.generateDescription')}
                </p>
              </div>

              <MethodSelector
                selectedMethod={selectedMethod}
                onMethodChange={setSelectedMethod}
                imageCount={images?.length || 0}
              />

              <button
                onClick={handleGenerate}
                disabled={!images || images.length === 0}
                className="w-full py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('wizard.generate')}
              </button>

              <button
                onClick={() => setWizardStep('metadata')}
                className="w-full py-2 text-text-secondary hover:text-earth transition-colors text-base"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-earth">
                  {t('wizard.processingTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {t('wizard.processingDescription')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-sand">
                <ReconstructionProgress
                  progress={getProgress()}
                  status={getProgressStatus()}
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-error">
                  {t('wizard.errorTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {reconstructError || infoCardError}
                </p>
              </div>

              <button
                onClick={() => {
                  resetReconstruct();
                  setWizardStep('generate');
                }}
                className="w-full py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  step: number;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, active, completed }: StepIndicatorProps) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
        completed
          ? 'bg-terracotta text-white'
          : active
          ? 'bg-terracotta text-white'
          : 'bg-sand text-text-secondary'
      }`}
    >
      {completed && !active ? '✓' : step}
    </div>
  );
}

// Result Tab Component
interface ResultTabProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: string;
}

function ResultTab({ children, active, onClick, icon, badge }: ResultTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 relative ${
        active ? 'text-terracotta' : 'text-text-muted hover:text-earth'
      }`}
    >
      {active && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-terracotta rounded-t-full" />
      )}
      {icon && (
        <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
          {icon}
        </span>
      )}
      <span className="hidden sm:inline font-display tracking-wide">{children}</span>
      {badge && (
        <span
          className={`text-md px-1.5 py-0.5 rounded ${
            active ? 'bg-terracotta/15 text-terracotta' : 'bg-sand text-text-muted'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

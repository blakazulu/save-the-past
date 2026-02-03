import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/layout';
import { MetadataForm } from '@/components/info-card';
import { MethodSelector } from '@/components/reconstruction/MethodSelector';
import { TextureModeSelector } from '@/components/reconstruction/TextureModeSelector';
import { ReconstructionProgress } from '@/components/reconstruction/ReconstructionProgress';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { InfoCardDisplay } from '@/components/info-card';
import { useJobsStore, useJobsHydrated } from '@/stores/jobsStore';
import { useRequestNotificationPermission } from '@/components/JobProcessor';
import { useSettingsStore } from '@/stores/settingsStore';
import { startReconstruct3D, blobToBase64 } from '@/lib/api/client';
import { CubeIcon, InfoIcon, TrashIcon } from '@/components/icons';
import type { ArtifactMetadata } from '@/types';
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
  const [manualTexturePrompt, setManualTexturePrompt] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('model');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const autoRemoveBackground = useSettingsStore((state) => state.autoRemoveBackground);
  const requestNotificationPermission = useRequestNotificationPermission();

  // Jobs store
  const { addJob, getJobByArtifactId } = useJobsStore();
  const hasHydrated = useJobsHydrated();

  // Get active job for this artifact (only after hydration)
  const activeJob = (hasHydrated && id) ? getJobByArtifactId(id) : undefined;
  const isProcessing = activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing');
  const hasJobError = activeJob?.status === 'failed';

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

  // Create object URL for model blob
  useEffect(() => {
    if (model?.blob) {
      const url = URL.createObjectURL(model.blob);
      setModelUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setModelUrl(null);
  }, [model]);

  // Skip to processing state if there's an active job (wait for hydration)
  useEffect(() => {
    if (hasHydrated && isProcessing) {
      setWizardStep('generate');
    }
  }, [isProcessing, hasHydrated]);

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

    // Remove any active jobs first to prevent orphaned processing
    if (activeJob) {
      useJobsStore.getState().removeJob(activeJob.id);
    }

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

    setIsStartingJob(true);
    setLocalError(null);

    try {
      // Request notification permission
      await requestNotificationPermission();

      // Convert image to base64
      const imageBlob = images[0].blob;
      const imageBase64 = await blobToBase64(imageBlob);

      // Use manual texture prompt if provided
      const texturePrompt = manualTexturePrompt.trim() || undefined;

      // Start the reconstruction task
      const result = await startReconstruct3D({
        imageBase64,
        removeBackground: autoRemoveBackground,
        texturePrompt,
      });

      if (!result.success || !result.data?.taskId) {
        throw new Error(result.error || result.data?.error || 'Failed to start reconstruction');
      }

      // Add job to store for background processing
      const jobId = uuidv4();
      addJob({
        id: jobId,
        artifactId: artifact.id,
        taskId: result.data.taskId,
        type: 'reconstruction',
        status: 'pending',
        progress: 0,
        imageBase64, // Keep for info card generation later
        metadata: { ...artifact.metadata },
      });

      // Update artifact status
      await db.artifacts.update(artifact.id, {
        status: 'processing-3d',
        updatedAt: new Date(),
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsStartingJob(false);
    }
  };

  // Get artifact name for display
  const artifactName = artifact.metadata.name ||
    t('artifact.defaultName', { date: artifact.createdAt.toLocaleDateString() });

  // Check if we have a completed model (show result view)
  const hasModel = !!model && !!modelUrl;
  const hasError = hasJobError || !!localError;
  const errorMessage = activeJob?.error || localError;

  // Get progress info from active job
  const getProgress = () => {
    if (!activeJob) return 0;
    // Show actual job progress, clamped to 0-100%
    return Math.min(100, Math.max(0, activeJob.progress));
  };

  const getProgressStatus = (): 'uploading' | 'processing' | 'saving' => {
    if (!activeJob) return 'processing';
    if (activeJob.progress < 10) return 'uploading';
    if (activeJob.progress >= 95) return 'saving';
    return 'processing';
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
            <div className="flex flex-col">
              <div className="p-4">
                <ModelViewer modelUrl={modelUrl} />
              </div>
              {model?.metadata?.fileSize && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between text-base text-text-secondary">
                    <span>{t('reconstruction.complete')}</span>
                    <span>{(model.metadata.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'info' && infoCard && (
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <InfoCardDisplay
                infoCard={infoCard}
                metadata={artifact.metadata}
                artifactName={artifactName}
              />
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
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-md mx-auto">
          {/* Step 1: Metadata - only show when not processing */}
          {wizardStep === 'metadata' && !isProcessing && !isStartingJob && !hasError && (
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
          {wizardStep === 'generate' && !isProcessing && !hasError && !isStartingJob && (
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

              <TextureModeSelector
                manualTexturePrompt={manualTexturePrompt}
                onManualTexturePromptChange={setManualTexturePrompt}
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

          {/* Starting Job State */}
          {isStartingJob && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-earth">
                  {t('wizard.processingTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {t('reconstruction.status.uploading')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-sand">
                <ReconstructionProgress
                  progress={20}
                  status="uploading"
                  startTime={Date.now()}
                />
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && !isStartingJob && (
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
                  startTime={activeJob?.startedAt}
                />
              </div>

              {/* Info that user can leave */}
              <div className="text-center">
                <p className="text-sm text-text-muted">
                  {t('wizard.canLeave')}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && !isStartingJob && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-error">
                  {t('wizard.errorTitle')}
                </h2>
                <p className="text-text-secondary text-base mt-1">
                  {errorMessage}
                </p>
              </div>

              <button
                onClick={async () => {
                  setLocalError(null);
                  // Remove failed job if exists
                  if (activeJob) {
                    useJobsStore.getState().removeJob(activeJob.id);
                  }
                  // Reset artifact status so user can retry
                  await db.artifacts.update(artifact.id, {
                    status: 'images-captured',
                    updatedAt: new Date(),
                  });
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
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${completed
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
      className={`flex-1 py-3.5 text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 relative ${active ? 'text-terracotta' : 'text-text-muted hover:text-earth'
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
          className={`text-md px-1.5 py-0.5 rounded ${active ? 'bg-terracotta/15 text-terracotta' : 'bg-sand text-text-muted'
            }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

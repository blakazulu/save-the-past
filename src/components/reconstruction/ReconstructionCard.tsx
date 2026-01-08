import { useTranslation } from 'react-i18next';
import { MethodSelector, type ReconstructionMethod } from './MethodSelector';
import { ReconstructionProgress } from './ReconstructionProgress';
import { TextureModeSelector, type TextureMode } from './TextureModeSelector';

type ReconstructionStatus = 'idle' | 'processing' | 'complete' | 'error';

interface ReconstructionCardProps {
  status: ReconstructionStatus;
  selectedMethod: ReconstructionMethod;
  onMethodChange: (method: ReconstructionMethod) => void;
  textureMode: TextureMode;
  onTextureModeChange: (mode: TextureMode) => void;
  manualTexturePrompt: string;
  onManualTexturePromptChange: (prompt: string) => void;
  onStartReconstruction: () => void;
  onRetry?: () => void;
  imageCount: number;
  progress?: number;
  progressStatus?: 'analyzing' | 'uploading' | 'processing' | 'saving';
  progressMessage?: string;
  errorMessage?: string;
  hasModel?: boolean;
  hasInfoCard?: boolean;
  onViewModel?: () => void;
}

export function ReconstructionCard({
  status,
  selectedMethod,
  onMethodChange,
  textureMode,
  onTextureModeChange,
  manualTexturePrompt,
  onManualTexturePromptChange,
  onStartReconstruction,
  onRetry,
  imageCount,
  progress = 0,
  progressStatus = 'processing',
  progressMessage,
  errorMessage,
  hasModel = false,
  hasInfoCard = false,
  onViewModel,
}: ReconstructionCardProps) {
  const { t } = useTranslation();

  // Processing state
  if (status === 'processing') {
    return (
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-info border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-earth">
              {t('reconstruction.processing')}
            </h3>
            <p className="text-base text-text-secondary">
              {t('reconstruction.pleaseWait')}
            </p>
          </div>
        </div>

        <ReconstructionProgress
          progress={progress}
          status={progressStatus}
          message={progressMessage}
        />
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
            <span className="text-xl">!</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-earth">
              {t('reconstruction.error')}
            </h3>
            <p className="text-base text-error">
              {errorMessage || t('reconstruction.errorDescription')}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-terracotta text-white py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    );
  }

  // Complete state
  if (status === 'complete' && hasModel) {
    return (
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-earth">
              {t('reconstruction.complete')}
            </h3>
            <p className="text-base text-text-secondary">
              {t('reconstruction.completeDescription')}
            </p>
          </div>
        </div>

        {onViewModel && (
          <button
            onClick={onViewModel}
            className="w-full bg-terracotta text-white py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
          >
            {t('reconstruction.viewModel')}
          </button>
        )}
      </div>
    );
  }

  // Idle state (default)
  return (
    <div className="bg-white rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center">
          <span className="text-xl">🧊</span>
        </div>
        <div>
          <h3 className="font-semibold text-earth">
            {t('reconstruction.title')}
          </h3>
          <p className="text-base text-text-secondary">
            {t('reconstruction.description')}
          </p>
        </div>
      </div>

      <MethodSelector
        selectedMethod={selectedMethod}
        onMethodChange={onMethodChange}
        imageCount={imageCount}
      />

      <TextureModeSelector
        textureMode={textureMode}
        onTextureModeChange={onTextureModeChange}
        manualTexturePrompt={manualTexturePrompt}
        onManualTexturePromptChange={onManualTexturePromptChange}
        hasInfoCard={hasInfoCard}
      />

      <button
        onClick={onStartReconstruction}
        disabled={imageCount === 0 || (textureMode === 'manual' && !manualTexturePrompt.trim())}
        className="w-full bg-terracotta text-white py-3 rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('reconstruction.generate')}
      </button>
    </div>
  );
}

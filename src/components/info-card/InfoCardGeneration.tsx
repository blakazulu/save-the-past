import { useTranslation } from 'react-i18next';

interface InfoCardGenerationProps {
  onGenerate: () => void;
  isGenerating: boolean;
  progress?: number;
  hasInfoCard?: boolean;
  onRegenerate?: () => void;
}

export function InfoCardGeneration({
  onGenerate,
  isGenerating,
  progress = 0,
  hasInfoCard = false,
  onRegenerate,
}: InfoCardGenerationProps) {
  const { t } = useTranslation();

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-info border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-earth">
              {t('infoCard.generating')}
            </h3>
            <p className="text-base text-text-secondary">
              {t('infoCard.generatingDescription')}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-base text-text-secondary text-center">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  if (hasInfoCard) {
    return (
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
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
              {t('infoCard.ready')}
            </h3>
            <p className="text-base text-text-secondary">
              {t('infoCard.readyDescription')}
            </p>
          </div>
        </div>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="w-full px-4 py-2 border border-sand text-earth rounded-lg font-medium hover:bg-sand transition-colors"
          >
            {t('infoCard.regenerate')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center">
          <span className="text-xl">📋</span>
        </div>
        <div>
          <h3 className="font-semibold text-earth">
            {t('infoCard.title')}
          </h3>
          <p className="text-base text-text-secondary">
            {t('infoCard.description')}
          </p>
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="w-full bg-terracotta text-white py-3 rounded-xl font-semibold hover:bg-clay transition-colors"
      >
        {t('infoCard.generate')}
      </button>
    </div>
  );
}

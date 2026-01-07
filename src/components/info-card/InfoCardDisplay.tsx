import { useTranslation } from 'react-i18next';
import type { InfoCard, LocalizedText } from '@/types';

interface InfoCardDisplayProps {
  infoCard: InfoCard;
  onEdit?: () => void;
  onExport?: () => void;
}

export function InfoCardDisplay({ infoCard, onEdit, onExport }: InfoCardDisplayProps) {
  const { t, i18n } = useTranslation();

  // Helper to get localized text based on current language
  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    const lang = i18n.language === 'he' ? 'he' : 'en';
    return text[lang] || text.en || '';
  };

  const confidenceColor = {
    high: 'text-success bg-success/10',
    medium: 'text-amber bg-amber/10',
    low: 'text-error bg-error/10',
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-earth">
          {t('infoCard.analysisTitle')}
        </h3>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-base border border-sand text-earth rounded-lg hover:bg-sand transition-colors"
            >
              {t('infoCard.edit')}
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1.5 text-base bg-terracotta text-white rounded-lg hover:bg-clay transition-colors"
            >
              {t('infoCard.export')}
            </button>
          )}
        </div>
      </div>

      {/* Info sections */}
      <div className="bg-white rounded-xl divide-y divide-sand">
        {/* Material */}
        <div className="p-4">
          <h4 className="text-base font-medium text-text-secondary mb-1">
            {t('infoCard.fields.material')}
          </h4>
          <p className="text-earth">{getLocalizedText(infoCard.material)}</p>
        </div>

        {/* Estimated Age */}
        <div className="p-4">
          <h4 className="text-base font-medium text-text-secondary mb-1">
            {t('infoCard.fields.estimatedAge')}
          </h4>
          <div className="flex items-center gap-2">
            <p className="text-earth">{getLocalizedText(infoCard.estimatedAge.range)}</p>
            <span
              className={`px-2 py-0.5 rounded-full text-md font-medium ${confidenceColor[infoCard.estimatedAge.confidence]
                }`}
            >
              {t(`infoCard.confidence.${infoCard.estimatedAge.confidence}`)}
            </span>
          </div>
          {infoCard.estimatedAge.reasoning && (
            <p className="text-base text-text-secondary mt-1">
              {getLocalizedText(infoCard.estimatedAge.reasoning)}
            </p>
          )}
        </div>

        {/* Possible Use */}
        <div className="p-4">
          <h4 className="text-base font-medium text-text-secondary mb-1">
            {t('infoCard.fields.possibleUse')}
          </h4>
          <p className="text-earth">{getLocalizedText(infoCard.possibleUse)}</p>
        </div>

        {/* Cultural Context */}
        <div className="p-4">
          <h4 className="text-base font-medium text-text-secondary mb-1">
            {t('infoCard.fields.culturalContext')}
          </h4>
          <p className="text-earth">{getLocalizedText(infoCard.culturalContext)}</p>
        </div>

        {/* Similar Artifacts */}
        {infoCard.similarArtifacts.length > 0 && (
          <div className="p-4">
            <h4 className="text-base font-medium text-text-secondary mb-2">
              {t('infoCard.fields.similarArtifacts')}
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {infoCard.similarArtifacts.map((artifact, index) => (
                <li key={index} className="text-earth text-base">
                  {getLocalizedText(artifact)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preservation Notes */}
        {getLocalizedText(infoCard.preservationNotes) && (
          <div className="p-4">
            <h4 className="text-base font-medium text-text-secondary mb-1">
              {t('infoCard.fields.preservationNotes')}
            </h4>
            <p className="text-earth">{getLocalizedText(infoCard.preservationNotes)}</p>
          </div>
        )}
      </div>

      {/* AI Disclaimer */}
      <div className="bg-info/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-base text-info font-medium mb-1">
              {t('infoCard.aiDisclaimer')}
            </p>
            <p className="text-md text-text-secondary">
              {getLocalizedText(infoCard.disclaimer)}
            </p>
            {infoCard.isHumanEdited && (
              <p className="text-md text-success mt-1">
                ✓ {t('infoCard.humanEdited')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

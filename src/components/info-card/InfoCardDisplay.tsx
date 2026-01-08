import { useTranslation } from 'react-i18next';
import type { InfoCard, LocalizedText, ArtifactMetadata } from '@/types';

interface InfoCardDisplayProps {
  infoCard: InfoCard;
  metadata?: ArtifactMetadata;
  artifactName?: string;
  onEdit?: () => void;
  onExport?: () => void;
}

export function InfoCardDisplay({
  infoCard,
  metadata,
  artifactName,
  onEdit,
  onExport,
}: InfoCardDisplayProps) {
  const { t, i18n } = useTranslation();

  // Helper to get localized text based on current language
  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    const lang = i18n.language === 'he' ? 'he' : 'en';
    return text[lang] || text.en || '';
  };

  const confidenceConfig = {
    high: {
      color: 'text-success',
      bg: 'bg-success/15',
      border: 'border-success/30',
      icon: '●',
    },
    medium: {
      color: 'text-amber',
      bg: 'bg-amber/15',
      border: 'border-amber/30',
      icon: '◐',
    },
    low: {
      color: 'text-error',
      bg: 'bg-error/15',
      border: 'border-error/30',
      icon: '○',
    },
  };

  const confidence = confidenceConfig[infoCard.estimatedAge.confidence];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Card - Artifact Identity */}
      <div className="parchment-card p-6 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-sepia">
            <path
              d="M100 0 L100 100 L0 100 Q50 50 100 0"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Title Section */}
        <div className="relative">
          {artifactName && (
            <h1 className="font-display text-2xl md:text-3xl text-earth mb-2 tracking-wide">
              {artifactName}
            </h1>
          )}

          {/* Location & Site badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {metadata?.siteName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/50 rounded-full text-sm text-text-secondary">
                <MapPinIcon className="w-3.5 h-3.5" />
                {metadata.siteName}
              </span>
            )}
            {metadata?.discoveryLocation && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/50 rounded-full text-sm text-text-secondary">
                <CompassIcon className="w-3.5 h-3.5" />
                {metadata.discoveryLocation}
              </span>
            )}
          </div>

          {/* Notes */}
          {metadata?.notes && (
            <div className="mt-4 p-3 bg-parchment-light/50 rounded-lg border-l-2 border-terracotta/30">
              <p className="text-sm text-text-secondary italic font-manuscript leading-relaxed">
                "{metadata.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(onEdit || onExport) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-sepia/10">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-2 text-sm border border-sand text-earth rounded-lg hover:bg-sand/50 transition-colors font-medium"
              >
                {t('infoCard.edit')}
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex-1 px-4 py-2 text-sm bg-terracotta text-white rounded-lg hover:bg-clay transition-colors font-medium"
              >
                {t('infoCard.export')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sepia/30 to-transparent" />
          <h2 className="font-display text-sm uppercase tracking-widest text-text-muted">
            {t('infoCard.analysisTitle')}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sepia/30 to-transparent" />
        </div>

        {/* Main Analysis Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Material Card */}
          <AnalysisCard
            icon={<LayersIcon />}
            label={t('infoCard.fields.material')}
            value={getLocalizedText(infoCard.material)}
            accent="terracotta"
          />

          {/* Age Card with Confidence */}
          <div className="parchment-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-text-muted">
                <ClockIcon className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide font-medium">
                  {t('infoCard.fields.estimatedAge')}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${confidence.bg} ${confidence.color} border ${confidence.border}`}
              >
                <span>{confidence.icon}</span>
                {t(`infoCard.confidence.${infoCard.estimatedAge.confidence}`)}
              </span>
            </div>
            <p className="text-earth font-semibold text-lg">
              {getLocalizedText(infoCard.estimatedAge.range)}
            </p>
            {infoCard.estimatedAge.reasoning && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {getLocalizedText(infoCard.estimatedAge.reasoning)}
              </p>
            )}
          </div>

          {/* Possible Use Card */}
          <AnalysisCard
            icon={<ToolIcon />}
            label={t('infoCard.fields.possibleUse')}
            value={getLocalizedText(infoCard.possibleUse)}
            accent="clay"
          />

          {/* Cultural Context Card */}
          <AnalysisCard
            icon={<GlobeIcon />}
            label={t('infoCard.fields.culturalContext')}
            value={getLocalizedText(infoCard.culturalContext)}
            accent="earth"
          />
        </div>

        {/* Similar Artifacts */}
        {infoCard.similarArtifacts.length > 0 && (
          <div className="parchment-card p-4">
            <div className="flex items-center gap-2 text-text-muted mb-3">
              <LinkIcon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">
                {t('infoCard.fields.similarArtifacts')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {infoCard.similarArtifacts.map((artifact, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1.5 bg-sand/40 rounded-lg text-sm text-earth border border-sand"
                >
                  {getLocalizedText(artifact)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preservation Notes */}
        {getLocalizedText(infoCard.preservationNotes) && (
          <div className="parchment-card p-4 border-l-4 border-amber">
            <div className="flex items-center gap-2 text-amber mb-2">
              <ShieldIcon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-semibold">
                {t('infoCard.fields.preservationNotes')}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {getLocalizedText(infoCard.preservationNotes)}
            </p>
          </div>
        )}
      </div>

      {/* AI Disclaimer Footer */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-info/5 rounded-xl" />
        <div className="relative p-4 rounded-xl border border-info/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-info/15 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-info">
                  {t('infoCard.aiDisclaimer')}
                </span>
                {infoCard.isHumanEdited && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/15 text-success text-xs rounded-full font-medium">
                    <CheckIcon className="w-3 h-3" />
                    {t('infoCard.humanEdited')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {getLocalizedText(infoCard.disclaimer)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analysis Card Component
interface AnalysisCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'terracotta' | 'clay' | 'earth' | 'amber';
}

function AnalysisCard({ icon, label, value, accent = 'terracotta' }: AnalysisCardProps) {
  const accentColors = {
    terracotta: 'border-l-terracotta',
    clay: 'border-l-clay',
    earth: 'border-l-earth',
    amber: 'border-l-amber',
  };

  return (
    <div className={`parchment-card p-4 border-l-4 ${accentColors[accent]}`}>
      <div className="flex items-center gap-2 text-text-muted mb-2">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-earth font-medium leading-relaxed">{value}</p>
    </div>
  );
}

// Icon Components
function MapPinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CompassIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v2m0 16v2M2 12h2m16 0h2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function LayersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function ToolIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function GlobeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function LinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

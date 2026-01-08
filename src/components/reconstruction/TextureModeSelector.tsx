import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type TextureMode = 'none' | 'manual';

interface TextureModeSelectorProps {
  manualTexturePrompt: string;
  onManualTexturePromptChange: (prompt: string) => void;
}

export function TextureModeSelector({
  manualTexturePrompt,
  onManualTexturePromptChange,
}: TextureModeSelectorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-earth transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {t('reconstruction.textureMode.title')}
        <span className="text-xs text-text-muted">({t('reconstruction.textureMode.optional')})</span>
      </button>

      {isExpanded && (
        <div className="ps-6 space-y-2">
          <p className="text-sm text-text-secondary">
            {t('reconstruction.textureMode.manual.description')}
          </p>
          <textarea
            value={manualTexturePrompt}
            onChange={(e) => onManualTexturePromptChange(e.target.value)}
            placeholder={t('reconstruction.textureMode.manual.placeholder')}
            maxLength={600}
            rows={2}
            className="w-full px-3 py-2 border border-sand rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta"
          />
          <p className="text-xs text-text-secondary text-end">
            {manualTexturePrompt.length}/600
          </p>
        </div>
      )}
    </div>
  );
}

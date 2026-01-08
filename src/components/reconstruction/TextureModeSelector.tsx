import { useTranslation } from 'react-i18next';

export type TextureMode = 'auto' | 'manual' | 'none';

interface TextureModeSelectorProps {
  textureMode: TextureMode;
  onTextureModeChange: (mode: TextureMode) => void;
  manualTexturePrompt: string;
  onManualTexturePromptChange: (prompt: string) => void;
  hasInfoCard?: boolean;
}

export function TextureModeSelector({
  textureMode,
  onTextureModeChange,
  manualTexturePrompt,
  onManualTexturePromptChange,
  hasInfoCard = false,
}: TextureModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-text-secondary">
        {t('reconstruction.textureMode.title')}
      </p>

      <div className="space-y-2">
        {/* Auto analyze option */}
        <label
          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            textureMode === 'auto'
              ? 'border-terracotta bg-terracotta/5'
              : 'border-sand hover:border-clay/50'
          }`}
        >
          <input
            type="radio"
            name="textureMode"
            value="auto"
            checked={textureMode === 'auto'}
            onChange={() => onTextureModeChange('auto')}
            className="mt-0.5 accent-terracotta"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-earth">
                {t('reconstruction.textureMode.auto.title')}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-terracotta/10 text-terracotta rounded">
                {t('reconstruction.textureMode.recommended')}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              {hasInfoCard
                ? t('reconstruction.textureMode.auto.descriptionWithInfoCard')
                : t('reconstruction.textureMode.auto.description')}
            </p>
          </div>
        </label>

        {/* Manual option */}
        <label
          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            textureMode === 'manual'
              ? 'border-terracotta bg-terracotta/5'
              : 'border-sand hover:border-clay/50'
          }`}
        >
          <input
            type="radio"
            name="textureMode"
            value="manual"
            checked={textureMode === 'manual'}
            onChange={() => onTextureModeChange('manual')}
            className="mt-0.5 accent-terracotta"
          />
          <div className="flex-1">
            <span className="font-medium text-earth">
              {t('reconstruction.textureMode.manual.title')}
            </span>
            <p className="text-sm text-text-secondary mt-0.5">
              {t('reconstruction.textureMode.manual.description')}
            </p>
          </div>
        </label>

        {/* Manual input field */}
        {textureMode === 'manual' && (
          <div className="ps-8">
            <textarea
              value={manualTexturePrompt}
              onChange={(e) => onManualTexturePromptChange(e.target.value)}
              placeholder={t('reconstruction.textureMode.manual.placeholder')}
              maxLength={600}
              rows={2}
              className="w-full px-3 py-2 border border-sand rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta"
            />
            <p className="text-xs text-text-secondary mt-1 text-end">
              {manualTexturePrompt.length}/600
            </p>
          </div>
        )}

        {/* None option */}
        <label
          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            textureMode === 'none'
              ? 'border-terracotta bg-terracotta/5'
              : 'border-sand hover:border-clay/50'
          }`}
        >
          <input
            type="radio"
            name="textureMode"
            value="none"
            checked={textureMode === 'none'}
            onChange={() => onTextureModeChange('none')}
            className="mt-0.5 accent-terracotta"
          />
          <div className="flex-1">
            <span className="font-medium text-earth">
              {t('reconstruction.textureMode.none.title')}
            </span>
            <p className="text-sm text-text-secondary mt-0.5">
              {t('reconstruction.textureMode.none.description')}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

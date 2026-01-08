import { useTranslation } from 'react-i18next';

export type ReconstructionMethod = 'single' | 'multi';

interface MethodSelectorProps {
  selectedMethod: ReconstructionMethod;
  onMethodChange: (method: ReconstructionMethod) => void;
  imageCount: number;
  disabled?: boolean;
}

export function MethodSelector({
  selectedMethod,
  onMethodChange,
  imageCount,
  disabled = false,
}: MethodSelectorProps) {
  const { t } = useTranslation();

  const methods: { id: ReconstructionMethod; minImages: number; comingSoon?: boolean }[] = [
    { id: 'single', minImages: 1 },
    { id: 'multi', minImages: 2, comingSoon: true },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-text-secondary">
        {t('reconstruction.selectMethod')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((method) => {
          const isDisabled = disabled || imageCount < method.minImages || method.comingSoon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => !isDisabled && onMethodChange(method.id)}
              disabled={isDisabled}
              className={`relative p-4 rounded-xl border-2 text-left transition-colors overflow-hidden ${isSelected
                  ? 'border-terracotta bg-terracotta/10'
                  : isDisabled
                    ? 'border-sand bg-sand/50 opacity-60 cursor-not-allowed'
                    : 'border-sand hover:border-clay bg-white'
                }`}
            >
              {method.comingSoon && (
                <div className="absolute top-0 right-0 bg-clay text-white text-xs font-semibold px-2 py-0.5 rounded-bl-lg">
                  {t('common.comingSoon')}
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                      ? 'border-terracotta bg-terracotta'
                      : 'border-clay'
                    }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={`font-semibold ${isSelected ? 'text-terracotta' : 'text-earth'
                    }`}
                >
                  {t(`reconstruction.method.${method.id}.title`)}
                </span>
              </div>
              <p className="text-base text-text-secondary ml-8">
                {t(`reconstruction.method.${method.id}.description`)}
              </p>
              {method.minImages > 1 && !method.comingSoon && (
                <p className="text-md text-text-secondary ml-8 mt-1">
                  {t('reconstruction.minImages', { count: method.minImages })}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

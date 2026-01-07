import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-2',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-sand border-t-terracotta rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <div className="text-center">
          {/* Decorative container */}
          <div className="relative inline-block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sand/30 to-parchment-dark/20 blur-lg" />
            </div>
            <div className="relative p-4">
              {spinner}
            </div>
          </div>

          <p className="font-manuscript text-text-secondary italic mt-4 animate-fade-in">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return spinner;
}

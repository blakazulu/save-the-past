import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MuseumIcon } from '@/components/icons';

interface MuseumEmptyProps {
  variant?: 'no-artifacts' | 'error' | 'loading';
  error?: string;
}

export function MuseumEmpty({ variant = 'no-artifacts', error }: MuseumEmptyProps) {
  const { t } = useTranslation();

  if (variant === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="cube-container">
          <div className="cube">
            <div className="cube-face cube-front" />
            <div className="cube-face cube-back" />
            <div className="cube-face cube-right" />
            <div className="cube-face cube-left" />
            <div className="cube-face cube-top" />
            <div className="cube-face cube-bottom" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 text-error">
          <MuseumIcon className="w-full h-full opacity-50" />
        </div>
        <p className="text-lg text-text-primary mb-2">{t('museum.errorLoading')}</p>
        {error && <p className="text-sm text-text-muted">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 mb-6 text-terracotta/30">
        <MuseumIcon className="w-full h-full" />
      </div>
      <h2 className="text-xl font-display text-earth mb-2">{t('museum.emptyTitle')}</h2>
      <p className="text-text-muted mb-6 max-w-sm">{t('museum.emptyDescription')}</p>
      <Link
        to="/capture"
        className="btn-primary px-6 py-2 rounded-lg font-medium"
      >
        {t('museum.createFirst')}
      </Link>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout';
import { CameraIcon, UploadIcon } from '@/components/icons';

export default function CapturePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <PageHeader title={t('capture.title')} backTo="/" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <p className="text-center text-text-secondary mb-8">
            {t('capture.instructions')}
          </p>

          {/* Camera Button */}
          <button className="w-full bg-terracotta text-white p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-clay transition-colors shadow-lg">
            <CameraIcon className="w-8 h-8" />
            <span className="text-lg font-semibold">{t('capture.camera')}</span>
          </button>

          {/* Upload Button */}
          <button className="w-full bg-white text-earth border-2 border-sand p-6 rounded-xl flex items-center justify-center gap-4 hover:bg-sand transition-colors">
            <UploadIcon className="w-8 h-8" />
            <span className="text-lg font-semibold">{t('capture.upload')}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

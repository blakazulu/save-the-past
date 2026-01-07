import { useTranslation } from 'react-i18next';

interface ReconstructionProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'saving';
  message?: string;
}

export function ReconstructionProgress({
  progress,
  status,
  message,
}: ReconstructionProgressProps) {
  const { t } = useTranslation();

  const statusMessage = message || t(`reconstruction.status.${status}`);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-2 bg-sand rounded-full overflow-hidden">
        <div
          className="h-full bg-terracotta rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Status info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{statusMessage}</span>
        <span className="font-medium text-earth">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

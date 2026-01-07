import { useTranslation } from 'react-i18next';
import type { ImageAngle } from '@/types';

interface CaptureOverlayProps {
  suggestedAngle: ImageAngle;
  capturedCount: number;
  totalAngles: number;
}

const ANGLE_ICONS: Record<ImageAngle, string> = {
  front: '⬆️',
  back: '⬇️',
  left: '⬅️',
  right: '➡️',
  top: '🔝',
  bottom: '🔻',
  detail: '🔍',
  context: '🖼️',
};

export function CaptureOverlay({
  suggestedAngle,
  capturedCount,
  totalAngles,
}: CaptureOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top info bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex justify-between items-center text-white">
          <div className="text-sm">
            {t('capture.photoCount', { count: capturedCount, total: totalAngles })}
          </div>
          <div className="bg-terracotta/90 px-3 py-1 rounded-full text-sm font-medium">
            {ANGLE_ICONS[suggestedAngle]} {t(`capture.angles.${suggestedAngle}`)}
          </div>
        </div>
      </div>

      {/* Center frame guide */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/50 rounded-2xl">
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-32 left-0 right-0 text-center">
        <p className="text-white/80 text-sm bg-black/40 inline-block px-4 py-2 rounded-full">
          {t('capture.alignHint')}
        </p>
      </div>
    </div>
  );
}

export const CAPTURE_ANGLES: ImageAngle[] = [
  'front',
  'back',
  'left',
  'right',
  'top',
  'bottom',
];

export const OPTIONAL_ANGLES: ImageAngle[] = ['detail', 'context'];

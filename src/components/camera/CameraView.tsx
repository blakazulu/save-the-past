import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaptureStore } from '@/stores';
import { logger } from '@/lib/utils/logger';

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  onError: (error: string) => void;
}

export function CameraView({ onCapture, onError }: CameraViewProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const { selectedCamera, setSelectedCamera } = useCaptureStore();

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: selectedCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      logger.error('Camera error:', err);
      onError(t('capture.cameraError'));
    }
  }, [selectedCamera, onError, t]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    setIsTakingPhoto(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
        setIsTakingPhoto(false);
      },
      'image/jpeg',
      0.9
    );
  }, [isReady, onCapture]);

  const toggleCamera = useCallback(() => {
    setSelectedCamera(selectedCamera === 'user' ? 'environment' : 'user');
  }, [selectedCamera, setSelectedCamera]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${
          selectedCamera === 'user' ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash effect when taking photo */}
      {isTakingPhoto && (
        <div className="absolute inset-0 bg-white animate-pulse" />
      )}

      {/* Camera controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
        {/* Switch camera button */}
        <button
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label={t('capture.switchCamera')}
        >
          <SwitchCameraIcon />
        </button>

        {/* Capture button */}
        <button
          onClick={takePhoto}
          disabled={!isReady || isTakingPhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-terracotta flex items-center justify-center hover:bg-sand transition-colors disabled:opacity-50"
          aria-label={t('capture.takePhoto')}
        >
          <div className="w-16 h-16 rounded-full bg-terracotta" />
        </button>

        {/* Placeholder for symmetry */}
        <div className="w-12 h-12" />
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>{t('capture.startingCamera')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SwitchCameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

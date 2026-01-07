import { create } from 'zustand';
import type { CaptureImage, ImageAngle } from '@/types';

type CameraFacing = 'user' | 'environment';

interface CaptureState {
  isCapturing: boolean;
  capturedImages: CaptureImage[];
  selectedCamera: CameraFacing;

  // Actions
  startCapture: () => void;
  endCapture: () => void;
  addCapturedImage: (image: CaptureImage) => void;
  removeCapturedImage: (id: string) => void;
  updateImageAngle: (id: string, angle: ImageAngle) => void;
  clearCapturedImages: () => void;
  setSelectedCamera: (camera: CameraFacing) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  isCapturing: false,
  capturedImages: [],
  selectedCamera: 'environment',

  startCapture: () => set({ isCapturing: true }),

  endCapture: () => set({ isCapturing: false }),

  addCapturedImage: (image) =>
    set((state) => ({
      capturedImages: [...state.capturedImages, image],
    })),

  removeCapturedImage: (id) =>
    set((state) => {
      const image = state.capturedImages.find((img) => img.id === id);
      if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return {
        capturedImages: state.capturedImages.filter((img) => img.id !== id),
      };
    }),

  updateImageAngle: (id, angle) =>
    set((state) => ({
      capturedImages: state.capturedImages.map((img) =>
        img.id === id ? { ...img, angle } : img
      ),
    })),

  clearCapturedImages: () =>
    set((state) => {
      // Revoke all preview URLs to free memory
      state.capturedImages.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      return { capturedImages: [] };
    }),

  setSelectedCamera: (camera) => set({ selectedCamera: camera }),
}));

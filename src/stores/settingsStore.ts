import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'he';
type ReconstructionMethod = 'single' | 'multi';

interface SettingsState {
  language: Language;
  default3DMethod: ReconstructionMethod;
  autoRemoveBackground: boolean;
  autoGenerateInfoCard: boolean;
  hapticsEnabled: boolean;

  // Actions
  setLanguage: (language: Language) => void;
  setDefault3DMethod: (method: ReconstructionMethod) => void;
  setAutoRemoveBackground: (enabled: boolean) => void;
  setAutoGenerateInfoCard: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      default3DMethod: 'single',
      autoRemoveBackground: true,
      autoGenerateInfoCard: true,
      hapticsEnabled: true,

      setLanguage: (language) => set({ language }),
      setDefault3DMethod: (method) => set({ default3DMethod: method }),
      setAutoRemoveBackground: (enabled) => set({ autoRemoveBackground: enabled }),
      setAutoGenerateInfoCard: (enabled) => set({ autoGenerateInfoCard: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
    }),
    {
      name: 'save-the-past-settings',
    }
  )
);

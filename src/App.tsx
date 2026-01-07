import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getDirection } from '@/i18n';
import { queryClient } from '@/lib/query';
import { InstallPrompt } from '@/components/ui';
import HomePage from '@/pages/HomePage';
import CapturePage from '@/pages/CapturePage';
import GalleryPage from '@/pages/GalleryPage';
import ArtifactDetailPage from '@/pages/ArtifactDetailPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = getDirection(i18n.language);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

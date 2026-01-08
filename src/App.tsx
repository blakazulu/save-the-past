import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getDirection } from '@/i18n';
import { queryClient } from '@/lib/query';
import { InstallPrompt, ErrorBoundary, LoadingSpinner, OfflineIndicator, ScribbleBackground } from '@/components/ui';
import { BottomNav } from '@/components/layout';

// Eager load lightweight pages
import HomePage from '@/pages/HomePage';
import SettingsPage from '@/pages/SettingsPage';

// Lazy load heavy pages (contain Three.js, complex forms, etc.)
const CapturePage = lazy(() => import('@/pages/CapturePage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const ArtifactDetailPage = lazy(() => import('@/pages/ArtifactDetailPage'));

function PageSkeleton() {
  // Maintains layout structure during lazy load to prevent flash/jump
  return (
    <div className="page-skeleton">
      {/* Header placeholder */}
      <div className="h-14 safe-area-top" />
      {/* Content area with centered spinner */}
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
      {/* Bottom nav placeholder */}
      <div className="h-16 safe-area-bottom" />
    </div>
  );
}

function AnimatedRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = getDirection(i18n.language);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScribbleBackground />
          <AnimatedRoutes />
          {/* BottomNav at app level - never unmounts during navigation */}
          <BottomNav />
          <InstallPrompt />
          <OfflineIndicator />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

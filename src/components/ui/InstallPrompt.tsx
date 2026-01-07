import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');

    if (isStandalone || wasDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-lg border border-sand p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-terracotta flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏛️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-earth text-sm">
              {t('pwa.installTitle', 'Install Save The Past')}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {t('pwa.installDescription', 'Add to home screen for the best experience')}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-secondary hover:text-earth p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 text-sm text-text-secondary hover:text-earth transition-colors"
          >
            {t('pwa.notNow', 'Not now')}
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-clay transition-colors"
          >
            {t('pwa.install', 'Install')}
          </button>
        </div>
      </div>
    </div>
  );
}

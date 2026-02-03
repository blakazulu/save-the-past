import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import './index.css';
import { logger } from '@/lib/utils/logger';

const VERSION_STORAGE_KEY = 'save-the-past-app-version';

// Check version and clear caches if needed - runs before app renders
async function checkVersionAndClearCacheIfNeeded(): Promise<boolean> {
  try {
    // Fetch version from server with cache-busting
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.warn('[Version Check] Could not fetch version.json');
      return false;
    }

    const { version: serverVersion } = await response.json();
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    logger.log(`[Version Check] Server: ${serverVersion}, Local: ${storedVersion || 'none'}`);

    // If versions match, no action needed
    if (storedVersion === serverVersion) {
      return false;
    }

    logger.log('[Version Check] Version mismatch - clearing caches and reloading...');

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      logger.log(`[Version Check] Cleared ${cacheNames.length} cache(s)`);
    }

    // Unregister service workers to ensure fresh fetch
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      logger.log(`[Version Check] Unregistered ${registrations.length} service worker(s)`);
    }

    // Store new version
    localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);

    // Reload to get fresh files
    window.location.reload();
    return true; // Indicates reload is happening
  } catch (err) {
    logger.error('[Version Check] Error:', err);
    return false;
  }
}

// Register service worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        logger.log('SW registration failed:', error);
      });
  }
}

// Initialize app
async function init() {
  // Check version first - if reload happens, this function won't continue
  const isReloading = await checkVersionAndClearCacheIfNeeded();
  if (isReloading) {
    return; // Stop execution, page is reloading
  }

  // Register service worker after version check passes
  registerServiceWorker();

  // Render app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

init();

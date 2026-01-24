# Version Check System

This document describes the client-side version check and cache-busting system used in Save The Past.

---

## Overview

The version check system ensures users always run the latest version of the app. On every app load, the client compares its cached version against the server's version. If they differ, all caches are cleared and the page reloads to fetch fresh assets.

---

## How It Works

```
App Starts
    │
    ▼
┌─────────────────────────────────┐
│ Fetch /version.json (no-cache)  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ Compare server version with     │
│ localStorage version            │
└─────────────────────────────────┘
    │
    ├── Match ──────► Continue to app
    │
    └── Mismatch ───► Clear caches
                          │
                          ▼
                    Unregister service workers
                          │
                          ▼
                    Save new version to localStorage
                          │
                          ▼
                    window.location.reload()
```

---

## Files

### `public/version.json`

Static file served from the public directory. **Must be updated on each deployment.**

```json
{
  "version": "1.0.0",
  "buildTime": "2024-01-24T00:00:00Z"
}
```

| Field | Description |
|-------|-------------|
| `version` | Semantic version string (e.g., "1.0.0", "1.2.3") |
| `buildTime` | ISO timestamp of build (optional, for reference) |

### `src/main.tsx`

Contains the version check logic that runs before the React app renders.

---

## Implementation Details

### Version Check Function

```typescript
const VERSION_STORAGE_KEY = 'save-the-past-app-version';

async function checkVersionAndClearCacheIfNeeded(): Promise<boolean> {
  try {
    // 1. Fetch version.json with cache-busting query param
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const { version: serverVersion } = await response.json();
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    // 2. If versions match, no action needed
    if (storedVersion === serverVersion) {
      return false;
    }

    // 3. Clear all Cache API caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // 4. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // 5. Store new version
    localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);

    // 6. Reload page
    window.location.reload();
    return true;
  } catch (err) {
    console.error('[Version Check] Error:', err);
    return false;
  }
}
```

### App Initialization

The version check runs **before** the React app renders:

```typescript
async function init() {
  // Check version first - if reload happens, execution stops here
  const isReloading = await checkVersionAndClearCacheIfNeeded();
  if (isReloading) {
    return; // Stop execution, page is reloading
  }

  // Only register service worker after version check passes
  registerServiceWorker();

  // Render app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

init();
```

---

## What Gets Cleared

| Cache Type | Cleared? | Method |
|------------|----------|--------|
| Cache API (service worker caches) | Yes | `caches.delete()` |
| Service Workers | Yes | `registration.unregister()` |
| Browser HTTP cache | Partially | Reload fetches fresh assets |
| localStorage | No | Only version key is updated |
| IndexedDB | No | User data preserved |
| sessionStorage | No | Preserved |

**Important:** User data in IndexedDB (artifacts, models, etc.) is NOT cleared. Only cached assets (JS, CSS, HTML, images) are refreshed.

---

## Deployment Workflow

### 1. Before Deployment

Update `public/version.json` with a new version:

```json
{
  "version": "1.1.0",
  "buildTime": "2024-01-25T10:30:00Z"
}
```

### 2. Deploy

Deploy your build to the hosting platform (Netlify, Vercel, etc.).

### 3. User Experience

When users next open the app:

1. App fetches `/version.json` (cache-busted with timestamp)
2. Detects version mismatch (1.0.0 → 1.1.0)
3. Clears all caches
4. Unregisters service workers
5. Reloads page
6. Fresh assets are downloaded
7. App runs with new version

---

## Console Logs

The version check logs its activity with `[Version Check]` prefix:

```
[Version Check] Server: 1.1.0, Local: 1.0.0
[Version Check] Version mismatch - clearing caches and reloading...
[Version Check] Cleared 3 cache(s)
[Version Check] Unregistered 1 service worker(s)
```

On subsequent loads (after update):

```
[Version Check] Server: 1.1.0, Local: 1.1.0
```

---

## Edge Cases

### First Visit (No Stored Version)

- `storedVersion` is `null`
- Comparison fails (null !== "1.0.0")
- Caches cleared (likely empty anyway)
- Version saved to localStorage
- Page reloads once

### Network Error

- Fetch fails
- Error logged to console
- App continues with cached version
- No user disruption

### version.json Not Found

- 404 response
- `response.ok` is false
- App continues normally
- No cache clearing

---

## Versioning Strategy

Use semantic versioning:

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fixes | Patch | 1.0.0 → 1.0.1 |
| New features | Minor | 1.0.0 → 1.1.0 |
| Breaking changes | Major | 1.0.0 → 2.0.0 |

**Tip:** You can also use build hashes (e.g., git commit SHA) if you prefer:

```json
{
  "version": "abc123f",
  "buildTime": "2024-01-25T10:30:00Z"
}
```

---

## Automating Version Updates

### Option 1: Manual

Update `public/version.json` before each deployment.

### Option 2: Build Script

Add a script to `package.json`:

```json
{
  "scripts": {
    "update-version": "node scripts/update-version.js",
    "build": "npm run update-version && vite build"
  }
}
```

Example `scripts/update-version.js`:

```javascript
const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../public/version.json');
const pkg = require('../package.json');

const content = {
  version: pkg.version,
  buildTime: new Date().toISOString()
};

fs.writeFileSync(versionFile, JSON.stringify(content, null, 2));
console.log(`Updated version.json to ${pkg.version}`);
```

### Option 3: Git Commit Hash

```javascript
const { execSync } = require('child_process');

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const content = {
  version: commitHash,
  buildTime: new Date().toISOString()
};
```

---

## Troubleshooting

### Users Still See Old Version

1. Check that `version.json` was updated before deployment
2. Verify the file is accessible: `curl https://your-app.com/version.json`
3. Check browser console for `[Version Check]` logs
4. Ensure the hosting platform isn't caching `version.json` (add cache headers if needed)

### Infinite Reload Loop

This shouldn't happen because:
- Version is saved to localStorage **before** reload
- On next load, versions will match

If it does occur:
1. Clear localStorage manually: `localStorage.removeItem('save-the-past-app-version')`
2. Check that `version.json` returns consistent content

### Cache Headers for version.json

If your CDN caches `version.json`, add headers to prevent it:

**Netlify (`netlify.toml`):**
```toml
[[headers]]
  for = "/version.json"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/version.json",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

---

## Security Considerations

- `version.json` is public and contains no sensitive data
- localStorage key is app-specific to avoid conflicts
- Cache clearing only affects browser caches, not server data
- User data (IndexedDB) is never touched

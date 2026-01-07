# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Save The Past is a mobile-first PWA for archaeology artifact documentation. Users photograph artifacts, generate AI-powered 3D reconstructions, and receive automated analysis (material, age, cultural context).

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build
```

## Architecture

### Tech Stack
- React 19 + TypeScript + Vite
- TailwindCSS v4 (via `@tailwindcss/postcss`)
- Zustand (state management)
- TanStack Query (async data)
- Dexie.js (IndexedDB for offline-first storage)
- i18next (English/Hebrew with RTL support)
- Netlify Functions (serverless backend)

### Data Flow

```
User Action → Zustand Store → Dexie (IndexedDB) → UI Update
                    ↓
            API Client → Netlify Functions → AI Services
                                              (HuggingFace / Gemini)
```

### Key Directories

- `src/stores/` - Three Zustand stores: `useAppStore` (runtime state), `useSettingsStore` (persisted preferences), `useCaptureStore` (capture session)
- `src/lib/db/` - Dexie database with 4 tables: `artifacts`, `images`, `models`, `infoCards`
- `src/lib/api/` - API client for Netlify Functions (`reconstruct3D`, `generateInfoCard`)
- `src/components/icons/` - Shared SVG icon components
- `src/components/layout/` - `PageHeader`, `BottomNav` (reusable across pages)
- `src/i18n/` - i18next config with auto-detection, locales in `locales/en.json` and `locales/he.json`

### Database Schema (Dexie/IndexedDB)

Artifacts have related entities via IDs:
- `Artifact` → has many `ArtifactImage` (via `artifactId`)
- `Artifact` → has one `Model3D` (via `model3DId`)
- `Artifact` → has one `InfoCard` (via `infoCardId`)

Use `getArtifactWithRelations()` to load an artifact with all related data.

### Path Alias

`@/` maps to `src/` - use for all imports (e.g., `import { db } from '@/lib/db'`)

## Design Constraints

1. **Mobile-first**: Design for phones first, scale up to desktop
2. **Bilingual**: All user-facing text must use `t()` from react-i18next with keys in both `en.json` and `he.json`
3. **RTL Support**: Use `rtl:` Tailwind variants for directional elements (e.g., back arrows use `rtl:rotate-180`)
4. **Single theme**: Warm earth-tone colors defined as CSS variables in `index.css` - no theme switching
5. **Offline-first**: All data stored in IndexedDB via Dexie

## Theme Colors

Primary palette (use via Tailwind classes like `bg-terracotta`, `text-earth`):
- `sand` (#E8DCC4) - backgrounds, cards
- `terracotta` (#C17F59) - primary actions
- `clay` (#A0522D) - accents, hover states
- `earth` (#8B4513) - headers, emphasis
- `text-primary` (#3D2914) - main text
- `text-secondary` (#6B5344) - secondary text

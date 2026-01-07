# Save The Past - Implementation Plan

**Purpose:** 3D reconstruction PWA for archaeology artifacts

## Design Principles

1. **Mobile-First**: Primary target is phone usage in the field; desktop is secondary but should look good
2. **Bilingual from Start**: English/Hebrew (RTL) localization in every component from day one
3. **Single Theme**: Warm earth-tone theme (browns, oranges, tans) - no theme switching
4. **PWA for Installation**: PWA features focus on phone installability and native appearance
5. **Living Document**: This plan is updated as implementation progresses

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4 (with `@tailwindcss/postcss`)
- Zustand (state management)
- TanStack Query (async data fetching)
- Dexie.js (IndexedDB, offline-first storage)
- Three.js + React Three Fiber (3D model viewer)
- i18next (English/Hebrew internationalization)
- Netlify Functions (serverless backend)

## AI Services

| Service | Provider | Purpose |
|---------|----------|---------|
| 3D Reconstruction | HuggingFace Spaces (TRELLIS.2 / TripoSR) | Generate GLB models from photos |
| Info Card Generation | Google Gemini 2.0 Flash | AI artifact analysis |

## Project Structure

```
save-the-past/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # App icons (192x192, 512x512)
├── src/
│   ├── components/
│   │   ├── camera/
│   │   │   ├── CaptureSession.tsx    # Multi-angle camera capture
│   │   │   ├── FileUpload.tsx        # Drag-and-drop upload
│   │   │   ├── CameraView.tsx        # Camera stream display
│   │   │   ├── CaptureOverlay.tsx    # Angle selection overlay
│   │   │   └── CapturePreview.tsx    # Preview captured images
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx       # Grid layout for artifacts
│   │   │   ├── GalleryList.tsx       # List layout alternative
│   │   │   ├── ArtifactCard.tsx      # Individual artifact card
│   │   │   ├── GalleryToolbar.tsx    # Search, filter, view toggle
│   │   │   └── GalleryFilters.tsx    # Filter panel
│   │   ├── info-card/
│   │   │   ├── InfoCardGeneration.tsx # AI generation interface
│   │   │   ├── InfoCardDisplay.tsx    # Display generated info
│   │   │   ├── InfoCardEditor.tsx     # Manual editing
│   │   │   ├── InfoCardExport.tsx     # Export as PDF/JSON/Markdown
│   │   │   └── MetadataForm.tsx       # Metadata input form
│   │   ├── layout/
│   │   │   ├── Layout.tsx            # Main wrapper
│   │   │   ├── Header.tsx            # App header
│   │   │   └── BottomNav.tsx         # Mobile bottom navigation
│   │   ├── reconstruction/
│   │   │   ├── ReconstructionCard.tsx # Main reconstruction UI
│   │   │   ├── ReconstructionProgress.tsx # Progress bar + status
│   │   │   └── MethodSelector.tsx     # Single vs multi-image selection
│   │   ├── ui/
│   │   │   ├── LoadingSpinner.tsx    # Loading indicator
│   │   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   │   ├── OfflineIndicator.tsx  # Offline status badge
│   │   │   └── InstallPrompt.tsx     # PWA install banner
│   │   └── viewer/
│   │       └── ModelViewer.tsx       # Three.js GLB viewer
│   ├── hooks/
│   │   ├── useReconstruct3D.ts       # Core 3D reconstruction logic
│   │   ├── useGenerateInfoCard.ts    # AI artifact analysis
│   │   ├── useArtifactData.ts        # Load artifact with relations
│   │   ├── useGalleryFilters.ts      # Filter/search/sort logic
│   │   └── useOfflineQueue.ts        # Offline operation queue
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts             # API wrapper functions
│   │   ├── db/
│   │   │   └── index.ts              # Dexie database schema
│   │   └── utils/
│   │       ├── image.ts              # Image processing utilities
│   │       └── export.ts             # Export utilities
│   ├── pages/
│   │   ├── HomePage.tsx              # Landing page
│   │   ├── CapturePage.tsx           # Camera/upload interface
│   │   ├── GalleryPage.tsx           # Artifact gallery
│   │   ├── ArtifactDetailPage.tsx    # Detail with tabs
│   │   └── SettingsPage.tsx          # App settings
│   ├── stores/
│   │   └── appStore.ts               # Zustand stores
│   ├── types/
│   │   └── artifact.ts               # TypeScript types
│   ├── i18n/
│   │   ├── index.ts                  # i18next config
│   │   └── locales/
│   │       ├── en.json               # English translations
│   │       └── he.json               # Hebrew translations
│   ├── App.tsx                       # Root component with routes
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles + Tailwind
├── netlify/
│   └── functions/
│       ├── reconstruct-3d.ts         # 3D reconstruction API
│       └── generate-info-card.ts     # Info card generation API
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── netlify.toml
```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Landing with app intro and CTA |
| `/capture` | CapturePage | Camera or file upload (multi-image) |
| `/gallery` | GalleryPage | Artifact grid with search/filter |
| `/artifact/:id` | ArtifactDetailPage | 3D viewer, photos, info card tabs |
| `/settings` | SettingsPage | Language, default preferences |

## Database Schema (IndexedDB via Dexie)

```typescript
// src/lib/db/index.ts
import Dexie, { Table } from 'dexie';

export class SaveThePastDB extends Dexie {
  artifacts!: Table<Artifact>;
  images!: Table<ArtifactImage>;
  models!: Table<Model3D>;
  infoCards!: Table<InfoCard>;

  constructor() {
    super('SaveThePastDB');
    this.version(1).stores({
      artifacts: 'id, createdAt, updatedAt, status, [metadata.siteName]',
      images: 'id, artifactId, angle, createdAt',
      models: 'id, artifactId, createdAt',
      infoCards: 'id, artifactId, createdAt',
    });
  }
}

export const db = new SaveThePastDB();
```

## Core Types

```typescript
// src/types/artifact.ts

export type ArtifactStatus =
  | 'draft'
  | 'images-captured'
  | 'processing-3d'
  | 'processing-info'
  | 'complete'
  | 'error';

export type ImageAngle =
  | 'front' | 'back' | 'left' | 'right'
  | 'top' | 'bottom' | 'detail' | 'context';

export interface Artifact {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: ArtifactStatus;
  imageIds: string[];
  model3DId?: string;
  infoCardId?: string;
  metadata: ArtifactMetadata;
  thumbnailBlob?: Blob;
}

export interface ArtifactMetadata {
  name?: string;
  discoveryLocation?: string;
  excavationLayer?: string;
  siteName?: string;
  dateFound?: Date;
  notes?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  tags?: string[];
}

export interface ArtifactImage {
  id: string;
  artifactId: string;
  blob: Blob;
  angle: ImageAngle;
  createdAt: Date;
  width: number;
  height: number;
}

export interface Model3D {
  id: string;
  artifactId: string;
  blob: Blob;
  format: 'glb' | 'gltf' | 'obj';
  createdAt: Date;
  source: '3d-single' | '3d-multi';
  metadata?: {
    vertices?: number;
    faces?: number;
    fileSize?: number;
  };
}

export interface InfoCard {
  id: string;
  artifactId: string;
  createdAt: Date;
  updatedAt: Date;
  material: string;
  estimatedAge: {
    range: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning?: string;
  };
  possibleUse: string;
  culturalContext: string;
  similarArtifacts: string[];
  preservationNotes: string;
  aiModel: string;
  aiConfidence: number;
  isHumanEdited: boolean;
  disclaimer: string;
}
```

## State Management (Zustand)

```typescript
// src/stores/appStore.ts

// Store 1: App State
interface AppState {
  currentArtifactId: string | null;
  processingStatus: ProcessingStatus | null;
  isOnline: boolean;
  isSidebarOpen: boolean;
  // Actions
  setCurrentArtifact: (id: string | null) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  updateProcessingProgress: (progress: number, message?: string) => void;
  setProcessingError: (error: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

// Store 2: Settings (Persisted)
interface SettingsState {
  language: 'en' | 'he';
  default3DMethod: 'single' | 'multi';
  autoRemoveBackground: boolean;
  autoGenerateInfoCard: boolean;
  hapticsEnabled: boolean;
  // Actions
  setLanguage: (language: 'en' | 'he') => void;
  setDefault3DMethod: (method: '3d-single' | '3d-multi') => void;
}

// Store 3: Capture Session
interface CaptureState {
  isCapturing: boolean;
  capturedImages: CaptureImage[];
  selectedCamera: 'user' | 'environment';
  // Actions
  startCapture: () => void;
  endCapture: () => void;
  addCapturedImage: (image: CaptureImage) => void;
  removeCapturedImage: (id: string) => void;
  clearCapturedImages: () => void;
}
```

## API Functions

### 1. reconstruct-3d.ts

```typescript
// netlify/functions/reconstruct-3d.ts

interface ReconstructRequest {
  imageBase64: string;
  method: 'trellis' | 'triposr';
  removeBackground?: boolean;
}

interface ReconstructResponse {
  success: boolean;
  modelBase64?: string;
  format?: 'glb';
  method?: 'trellis' | 'triposr';
  processingTimeMs?: number;
  error?: string;
  retryCount?: number;
}

// Implementation:
// - TRELLIS.2 (primary): High-quality 4B parameter model via HuggingFace Spaces
// - TripoSR (fallback): Faster Stability AI model
// - Automatic fallback if primary fails
// - Retry logic with exponential backoff
// - Rate limit detection (429 status)
```

### 2. generate-info-card.ts

```typescript
// netlify/functions/generate-info-card.ts

interface InfoCardRequest {
  imageBase64: string;
  metadata?: Partial<ArtifactMetadata>;
}

interface InfoCardResponse {
  success: boolean;
  infoCard?: Omit<InfoCard, 'id' | 'artifactId' | 'createdAt' | 'updatedAt'>;
  error?: string;
  processingTimeMs?: number;
}

// Implementation:
// - Google Gemini 2.0 Flash
// - Archaeology-focused analysis prompt
// - Returns structured JSON with material, age, cultural context
```

## Key Hooks

### useReconstruct3D

```typescript
// src/hooks/useReconstruct3D.ts

interface UseReconstruct3DReturn {
  reconstruct: (artifactId: string, imageBlobs: Blob[], method: 'single' | 'multi') => Promise<void>;
  progress: number;           // 0-100
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error: string | null;
  model: Model3D | null;
  cancel: () => void;
}

// Progress breakdown:
// 0-30%: Uploading images
// 30-90%: Processing on HuggingFace
// 90-100%: Saving model to IndexedDB
```

### useGenerateInfoCard

```typescript
// src/hooks/useGenerateInfoCard.ts

interface UseGenerateInfoCardReturn {
  generate: (artifactId: string, imageBlob: Blob, metadata?: ArtifactMetadata) => Promise<void>;
  progress: number;
  status: 'idle' | 'generating' | 'complete' | 'error';
  error: string | null;
  infoCard: InfoCard | null;
}
```

## User Flows

### Flow 1: Capture → Reconstruct → View

```
1. User opens /capture
2. Selects camera or file upload
3. Takes 1-10 photos from different angles (guided UI)
4. Creates artifact with status: 'images-captured'
5. Redirects to /artifact/:id
6. User selects reconstruction method (single/multi)
7. Clicks "Generate 3D Model"
8. useReconstruct3D hook:
   - Converts Blobs to base64
   - Calls reconstruct-3d function
   - Shows progress (uploading → processing → saving)
   - Saves GLB to IndexedDB
   - Updates artifact with model3DId
9. ModelViewer displays the 3D model
10. User can rotate, zoom, download GLB
```

### Flow 2: Generate Info Card

```
1. From /artifact/:id, user clicks Info tab
2. Clicks "Generate Info Card"
3. useGenerateInfoCard hook:
   - Sends best image to Gemini
   - Receives structured analysis
   - Saves InfoCard to IndexedDB
4. InfoCardDisplay shows results
5. User can edit with InfoCardEditor
6. Export as PDF, JSON, or Markdown
```

## Implementation Steps

### Phase 1: Project Setup & Foundation
- [x] Initialize Vite + React + TypeScript project
- [x] Configure TailwindCSS v4 with `@tailwindcss/postcss`
- [x] Set up path alias `@/` → `src/` in vite.config.ts and tsconfig.json
- [x] Configure warm earth-tone theme (single theme, no switching)
- [x] Set up i18next with en/he locales from the start
- [x] Configure RTL support for Hebrew
- [x] Add PWA manifest.json (for phone installation)
- [x] Configure Netlify deployment (netlify.toml)

### Phase 2: Core Infrastructure
- [ ] Implement Dexie database schema
- [ ] Create Zustand stores (app, settings, capture)
- [ ] Set up TanStack Query provider
- [ ] Create API client wrapper (`src/lib/api/client.ts`)
- [ ] Build utility functions (image processing, export)

### Phase 3: Layout & Navigation (Mobile-First)
- [x] Create Layout component with Header and BottomNav (mobile-first)
- [x] Set up React Router with all routes
- [x] Build HomePage with app introduction (mobile-first, scales to desktop)
- [x] Create SettingsPage with language toggle
- [ ] Add offline indicator component
- [ ] Ensure all layouts work well on phones, scale gracefully to desktop

### Phase 4: Camera & Upload
- [ ] Build CameraView with stream display
- [ ] Create CaptureOverlay with angle guidance
- [ ] Implement CaptureSession with multi-photo flow
- [ ] Build FileUpload with drag-and-drop
- [ ] Create CapturePreview for reviewing images
- [ ] Wire up CapturePage with both options

### Phase 5: Gallery
- [ ] Build ArtifactCard component
- [ ] Create GalleryGrid and GalleryList layouts
- [ ] Implement GalleryToolbar (search, filters, view toggle)
- [ ] Build GalleryFilters panel
- [ ] Create useGalleryFilters hook
- [ ] Add empty states and loading skeletons

### Phase 6: 3D Reconstruction
- [ ] Create MethodSelector component
- [ ] Build ReconstructionProgress with status messages
- [ ] Implement ReconstructionCard (idle, processing, complete, error states)
- [ ] Create useReconstruct3D hook with full progress tracking
- [ ] Build ModelViewer with Three.js:
  - GLB loading
  - OrbitControls
  - Lighting setup
  - Download button

### Phase 7: Info Card
- [ ] Create MetadataForm for artifact details
- [ ] Build InfoCardGeneration trigger UI
- [ ] Implement useGenerateInfoCard hook
- [ ] Create InfoCardDisplay with formatted sections
- [ ] Build InfoCardEditor for manual edits
- [ ] Add InfoCardExport (PDF, JSON, Markdown)

### Phase 8: Backend Functions
- [ ] Implement reconstruct-3d.ts:
  - TRELLIS.2 integration via Gradio client
  - TripoSR fallback
  - Retry logic with exponential backoff
  - Error handling and categorization
- [ ] Implement generate-info-card.ts:
  - Gemini 2.0 Flash integration
  - Archaeology analysis prompt
  - Structured JSON response parsing

### Phase 9: Artifact Detail Page
- [ ] Build DetailHeader with back navigation
- [ ] Create TabNav (3D Model, Photos, Info)
- [ ] Implement Model3DTab with ModelViewer + ReconstructionCard
- [ ] Build PhotosTab with image grid
- [ ] Create InfoTab with InfoCard components
- [ ] Wire up ArtifactDetailPage with all tabs

### Phase 10: PWA Installation
- [ ] Add InstallPrompt for PWA installation on phones
- [ ] Configure service worker for basic asset caching
- [ ] Test PWA installation on iOS and Android
- [ ] Ensure app looks native on phone home screens

### Phase 11: Data Management
- [ ] Build ExportDialog (ZIP with all data)
- [ ] Create ImportDialog (restore from ZIP)
- [ ] Add DeleteConfirmDialog
- [ ] Implement bulk operations in gallery

### Phase 12: Polish
- [ ] Final responsive testing (phone priority, desktop secondary)
- [ ] Loading states and skeleton screens
- [ ] Error boundaries and fallback UI
- [ ] Accessibility audit (ARIA labels, keyboard nav)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Final RTL/i18n verification for Hebrew

## Environment Variables

```env
# .env (local development)
GOOGLE_AI_API_KEY=your_gemini_api_key

# Netlify environment variables (production)
# Set via Netlify dashboard or CLI:
# netlify env:set GOOGLE_AI_API_KEY your_gemini_api_key
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.0",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.0.0",
    "@react-three/drei": "^9.0.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "i18next-browser-languagedetector": "^8.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.170.0",
    "@types/uuid": "^10.0.0",
    "eslint": "^9.0.0",
    "@netlify/functions": "^3.0.0",
    "@gradio/client": "^1.0.0"
  }
}
```

## Notes

- TRELLIS.2 provides higher quality models but is slower
- TripoSR is faster but lower quality - good fallback
- Info card generation uses Gemini 2.0 Flash for speed and cost efficiency
- All data stored locally in IndexedDB (privacy-first, no cloud storage)
- PWA is for phone installation and native appearance (not offline-first)
- Mobile-first design: optimize for phone usage, ensure desktop looks good
- Single warm earth-tone theme based on design mockup (no theme switching)
- en/he localization built into every component from day one

## Theme Colors (Earth Tones)

Based on the design mockup, the app uses warm archaeology-inspired colors:

```css
/* Primary earth tones */
--color-sand: #E8DCC4;        /* Background, cards */
--color-terracotta: #C17F59;  /* Primary actions, highlights */
--color-clay: #A0522D;        /* Accent, borders */
--color-earth: #8B4513;       /* Headers, emphasis */
--color-amber: #D4A574;       /* Secondary elements */

/* Text colors */
--color-text-primary: #3D2914;   /* Main text */
--color-text-secondary: #6B5344; /* Secondary text */

/* Supporting colors */
--color-success: #6B8E23;     /* Success states */
--color-error: #CD5C5C;       /* Error states */
--color-info: #7B9EA8;        /* Info states */
```

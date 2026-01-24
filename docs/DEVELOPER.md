# Save The Past - Developer Documentation

This document covers the technical implementation details for developers working on the Save The Past application.

---

## Table of Contents

1. [Public Data Architecture](#1-public-data-architecture)
2. [Museum Upload System](#2-museum-upload-system)
3. [Virtual Museum Implementation](#3-virtual-museum-implementation)

---

## 1. Public Data Architecture

### Overview

Save The Past follows a **public-first data model**. All artifacts, images, and 3D models created by users are automatically shared publicly to the museum. There is no private/personal-only mode.

### Data Storage

| Data Type | Local Storage | Cloud Storage |
|-----------|---------------|---------------|
| Artifacts | Dexie (IndexedDB) | Firestore `museum_artifacts` |
| Images | Dexie `images` table | Firebase Storage `museum/thumbnails/` |
| 3D Models | Dexie `models` table | Firebase Storage `museum/models/` |
| Info Cards | Dexie `infoCards` table | Embedded in Firestore document |

### Data Flow

```
User Creates Artifact
        ↓
[Saved to Local IndexedDB]
        ↓
[3D Model Generated]
        ↓
[Auto-queued for Museum Upload]
        ↓
[Uploaded to Firebase]
        ↓
[Visible to ALL Users in Gallery & Museum]
```

### Gallery Tabs

The Gallery page (`/gallery`) has two tabs:

1. **My Artifacts** - Shows artifacts from local IndexedDB (your device only)
2. **Public Artifacts** - Shows ALL artifacts from Firebase (everyone's uploads)

Both tabs display the same artifacts for users who have uploaded - "My Artifacts" is essentially a local cache of what you've created, while "Public Artifacts" shows everything in the cloud.

### Why Public-First?

- **Archaeological collaboration**: Artifacts should be shared for research
- **Community museum**: The virtual tour displays artifacts from all users
- **Simplicity**: No authentication or user accounts required
- **Device ID tracking**: Each upload is tagged with a device ID for moderation purposes

---

## 2. Museum Upload System

### Automatic Upload Flow

When a 3D model is successfully generated, the app automatically queues it for museum upload:

**File:** `src/components/JobProcessor.tsx` (lines 239-242)

```typescript
// Queue for museum upload (fire-and-forget)
enqueueMuseumUpload(job.artifactId).catch((err) => {
  console.error('Failed to enqueue museum upload:', err);
});
```

### Upload Queue System

**File:** `src/lib/firebase/uploadQueue.ts`

The upload queue is a persistent system that handles uploads with retry logic:

```typescript
interface PendingMuseumUpload {
  id: string;
  artifactId: string;
  status: 'pending' | 'uploading' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}
```

#### Queue Processing

1. **Enqueue**: `enqueueMuseumUpload(artifactId)` adds to `pendingUploads` table
2. **Process**: `processUploadQueue()` runs immediately and periodically (every 2 minutes)
3. **Retry**: Failed uploads retry with exponential backoff: 0s, 5s, 15s, 45s, 120s
4. **Max Attempts**: 5 attempts before marking as permanently failed

### Retry Mechanisms

#### 1. Immediate Retry (During Session)

Failed uploads automatically retry based on the delay schedule:

```typescript
const RETRY_DELAYS = [0, 5000, 15000, 45000, 120000]; // ms
```

#### 2. Online Event Retry

When the device comes back online:

```typescript
window.addEventListener('online', () => {
  console.log('[Museum Upload] Back online, processing museum upload queue...');
  processUploadQueue();
});
```

#### 3. Periodic Retry

Every 2 minutes while online:

```typescript
setInterval(() => {
  if (navigator.onLine) {
    processUploadQueue();
  }
}, 2 * 60 * 1000);
```

#### 4. Startup Retry (App Load)

**Critical Feature**: On app startup, failed uploads are retried once (max once per 24 hours):

```typescript
const STARTUP_RETRY_KEY = 'save-the-past-last-startup-retry';
const STARTUP_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function retryFailedUploadsOnce(): Promise<void> {
  // Check if we've already retried recently
  const lastRetry = localStorage.getItem(STARTUP_RETRY_KEY);
  if (lastRetry) {
    const lastRetryTime = parseInt(lastRetry, 10);
    if (Date.now() - lastRetryTime < STARTUP_RETRY_INTERVAL_MS) {
      console.log('[Museum Upload] Skipping startup retry - already retried within 24 hours');
      return;
    }
  }

  const failedUploads = await db.pendingUploads
    .where('status')
    .equals('failed')
    .toArray();

  if (failedUploads.length === 0) return;

  // Mark retry time and reset failed uploads to pending
  localStorage.setItem(STARTUP_RETRY_KEY, Date.now().toString());

  for (const upload of failedUploads) {
    await db.pendingUploads.update(upload.id, {
      status: 'pending',
      attempts: Math.max(0, upload.attempts - 1), // Give one more attempt
      error: undefined,
    });
  }
}
```

#### 5. Manual Retry (Settings Page)

Users can manually trigger retries from **Settings > Museum Sync**:

- **Sync to Museum**: Queues any un-uploaded completed artifacts
- **Retry Failed Uploads**: Resets failed uploads to pending
- **Force Re-sync All**: Re-uploads everything (for recovery scenarios)

### Upload Process Details

**File:** `src/lib/firebase/museumService.ts`

```typescript
export async function uploadToMuseum({
  artifact,
  model,
  infoCard,
  thumbnailSource,
}: UploadToMuseumParams): Promise<string> {
  // 1. Generate thumbnail (400px max, JPEG 0.8 quality)
  const thumbnail = await generateThumbnail(thumbnailSource);

  // 2. Upload thumbnail to Firebase Storage
  const thumbnailRef = ref(storage, `museum/thumbnails/${artifactId}.jpg`);
  await uploadBytes(thumbnailRef, thumbnail);
  const thumbnailUrl = await getDownloadURL(thumbnailRef);

  // 3. Optimize and upload 3D model (if exists)
  if (model?.blob) {
    const optimizedModel = model.format === 'glb'
      ? await optimizeModel(model.blob)  // 50-70% size reduction
      : model.blob;

    const modelRef = ref(storage, `museum/models/${artifactId}.${model.format}`);
    await uploadBytes(modelRef, optimizedModel);
    modelUrl = await getDownloadURL(modelRef);
  }

  // 4. Create Firestore document
  await setDoc(doc(firestore, 'museum_artifacts', artifactId), {
    localArtifactId: artifactId,
    name: artifact.metadata.name || 'Unnamed Artifact',
    thumbnailUrl,
    modelUrl,
    modelFormat,
    infoCard: infoCard ? toMuseumInfoCard(infoCard) : null,
    createdAt: serverTimestamp(),
    deviceId: getDeviceId(),
    status: 'published',
  });

  return artifactId;
}
```

### Upload Progress UI

**File:** `src/components/ui/UploadProgress.tsx`

The upload progress component shows:

- Real-time upload status (pending, uploading, optimizing, completed, failed)
- Error details for failed uploads (expandable)
- Retry button for failed uploads
- Auto-dismisses on success (after 3 seconds)
- Persists on failure until manually dismissed or retried

### Debug Logging

All upload operations are logged with `[Museum Upload]` prefix:

```
[Museum Upload] Enqueued artifact abc123 for upload
[Museum Upload] Processing queue: 1 pending uploads
[Museum Upload] Starting upload for artifact abc123 (attempt 1)
[Museum Upload] Uploading "Ancient Pottery" - has model: true, has infoCard: true
[Museum Upload] Optimizing model for abc123 (245.3 KB)
[Museum Upload] Uploading to Firebase for abc123...
[Museum Upload] Successfully uploaded artifact abc123 to museum
```

### Firestore Schema

**Collection:** `museum_artifacts`

```typescript
{
  // Identity
  id: string;                    // Document ID (same as artifact ID)
  localArtifactId: string;       // Reference to source artifact
  deviceId: string;              // Device that uploaded (for moderation)

  // Display
  name: string;
  siteName?: string;
  discoveryLocation?: string;

  // Media URLs (Firebase Storage)
  thumbnailUrl: string;          // /museum/thumbnails/{id}.jpg
  modelUrl: string;              // /museum/models/{id}.{format}
  modelFormat: 'glb' | 'gltf' | 'obj';

  // Embedded info card (denormalized)
  infoCard?: {
    material: { en: string; he: string };
    estimatedAge: {
      range: { en: string; he: string };
      confidence: 'high' | 'medium' | 'low';
    };
    possibleUse: { en: string; he: string };
    culturalContext: { en: string; he: string };
    preservationNotes: { en: string; he: string };
    aiConfidence: number;
  };

  // Metadata
  createdAt: Timestamp;
  status: 'published' | 'flagged' | 'removed';
}
```

---

## 3. Virtual Museum Implementation

### Overview

The virtual museum is a first-person 3D walking experience built with:

- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D rendering engine
- **@react-three/drei**: Helper components (useGLTF, PointerLockControls)

### Architecture

```
VirtualTourPage (Main Component)
    ↓
┌─────────────────────────────────────┐
│  Canvas (React Three Fiber)         │
│  ├── ProceduralGallery              │
│  │   ├── Walls & Rooms              │
│  │   ├── Floor & Ceiling            │
│  │   ├── Skylights                  │
│  │   ├── Wall Decorations           │
│  │   └── Lighting                   │
│  ├── Pedestals (16)                 │
│  │   └── ArtifactModel (GLB)        │
│  ├── Controls                       │
│  │   ├── FirstPersonControls (desktop)│
│  │   └── TouchControls (mobile)     │
│  ├── ProximityDetector              │
│  └── CameraTeleporter               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  UI Overlays (React DOM)            │
│  ├── Loading Screen                 │
│  ├── Texture Progress               │
│  ├── Instructions                   │
│  ├── Info Card Overlay              │
│  ├── Teleport Button                │
│  └── Exit Button                    │
└─────────────────────────────────────┘
```

### Gallery Layout

**File:** `src/components/virtual-tour/ProceduralGallery.tsx`

The museum is a procedurally-generated space with 8 rooms and 16 pedestals:

```
                    Entrance Lobby (z=16)
                           ↓
    ┌──────────────────────────────────────────┐
    │                South Corridor             │
    ├─────────┬─────────────────────┬──────────┤
    │         │    Grand Hall       │          │
    │ Room D  │   (Main Gallery)    │  Room E  │
    │         │                     │          │
    ├─────────┴─────────────────────┴──────────┤
    │              North Corridor               │
    ├─────────┬─────────┬─────────┬────────────┤
    │ Room A  │ Room B  │ Room B  │  Room C    │
    │(Ancient)│(Central)│(Central)│ (Medieval) │
    └─────────┴─────────┴─────────┴────────────┘
                    (Back Wall z=-20)
```

**Gallery Dimensions:**
- Width: 30 units (X: -15 to +15)
- Depth: 40 units (Z: -20 to +20)
- Height: 5 units

### Pedestal Positions

**Export:** `PEDESTAL_POSITIONS: [number, number, number][]`

16 pedestals placed throughout the gallery:

| Location | Position (x, y, z) | Room |
|----------|-------------------|------|
| 0 | [-11, 0, -14] | Room A (Ancient) |
| 1-2 | [-1.5, 0, -14], [1.5, 0, -14] | Room B (Central) |
| 3 | [11, 0, -14] | Room C (Medieval) |
| 4-7 | [-12, 0, -8] to [12, 0, -8] | North Corridor |
| 8 | [-11, 0, 0] | Room D (Classical) |
| 9-11 | [-2, 0, 2] to [0, 0, 6] | Grand Hall |
| 12 | [11, 0, 0] | Room E (Modern) |
| 13-14 | [-10, 0, 12], [10, 0, 12] | South Corridor |
| 15-16 | [-3, 0, 16], [3, 0, 16] | Entrance Lobby |

Artifacts are assigned from entrance to back using `ENTRANCE_TO_BACK_ORDER` mapping.

### Artifact Loading

**File:** `src/pages/VirtualTourPage.tsx`

```typescript
interface DisplayArtifact {
  id: string;
  name: string;
  modelUrl: string | null;
  isPersonal: boolean;
  siteName?: string;
  infoCard?: { /* bilingual info card data */ };
}

// Load artifacts on mount
useEffect(() => {
  async function loadArtifacts() {
    // 1. Personal artifacts from Dexie (with blob URLs)
    const personalArtifacts = await db.artifacts.toArray();
    for (const artifact of personalArtifacts) {
      if (artifact.model3DId) {
        const model = await db.models.get(artifact.model3DId);
        if (model?.blob) {
          const modelUrl = URL.createObjectURL(model.blob);
          blobUrlsRef.current.push(modelUrl); // Track for cleanup
          // Create DisplayArtifact...
        }
      }
    }

    // 2. Museum artifacts from Firestore (with storage URLs)
    const museumArtifacts = await fetchMuseumArtifacts();
    // Map to DisplayArtifacts using remote modelUrls...

    // 3. Combine, shuffle, limit to 16
    const allArtifacts = [...personal, ...museum];
    const shuffled = allArtifacts.sort(() => Math.random() - 0.5);
    setArtifacts(shuffled.slice(0, 16));
  }
  loadArtifacts();
}, []);
```

### 3D Model Rendering

```typescript
function ArtifactModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  // Memoize to prevent re-cloning on every render
  const { clonedScene, rotation } = useMemo(() => ({
    clonedScene: scene.clone(),
    rotation: [0, Math.random() * Math.PI * 2, 0], // Random Y rotation
  }), [scene]);

  return (
    <primitive
      object={clonedScene}
      scale={0.5}
      rotation={rotation}
    />
  );
}

// Usage with Suspense
<Suspense fallback={<SimpleLoader />}>
  <ArtifactModel url={artifact.modelUrl} />
</Suspense>
```

### Pedestal Component

Each pedestal includes:
- Base geometry (white marble look)
- Display surface (glowing emissive)
- Uplight (PointLight, intensity 0.5)
- Spotlight from above (intensity 2.0)
- Artifact mounted at y=1.6

### Controls

**Desktop (FirstPersonControls):**
- WASD / Arrow keys: Movement
- Mouse: Look around (requires pointer lock)
- Shift: Sprint (2x speed)
- Click canvas: Enable pointer lock
- ESC: Exit

**Mobile (TouchControls + VirtualJoystick):**
- Left joystick: Movement
- Right side drag: Look around
- Tap: Interact

**Movement Constants:**
- Base speed: 5 units/second
- Sprint: 2x multiplier
- Look sensitivity: 0.003 rad/pixel
- Player height: 1.7 units

### Collision Detection

**File:** `src/components/virtual-tour/collision.ts`

```typescript
const PLAYER_RADIUS = 0.4;

// Two boundary types
interface BoxBoundary {
  type: 'box';
  center: [number, number, number];
  size: [number, number, number];
}

interface CylinderBoundary {
  type: 'cylinder';
  center: [number, number, number];
  radius: number;
}

// Check collision with all boundaries
function checkCollision(position: Vector3, boundaries: CollisionBoundary[]): boolean;

// Get safe position with wall sliding
function getSafePosition(current: Vector3, target: Vector3, boundaries: CollisionBoundary[]): Vector3;
```

Wall sliding tries X-only, then Z-only movement if full movement would collide.

### Proximity Detection

Detects when player approaches a pedestal:

```typescript
const PROXIMITY_THRESHOLD = 2.5; // units

useFrame(() => {
  for (let i = 0; i < PEDESTAL_POSITIONS.length; i++) {
    const distance = camera.position.distanceTo(pedestalPosition);

    if (distance < PROXIMITY_THRESHOLD && isFacingPedestal) {
      onNearArtifact(artifacts[i], i);
    }
  }
});
```

### Camera Teleportation

Smooth animated jump between artifacts:

```typescript
// Triggered by "Next Artifact" button
function teleportToArtifact(pedestalIndex: number) {
  const [px, , pz] = PEDESTAL_POSITIONS[pedestalIndex];

  // Target: 2 units in front of pedestal, eye height
  const target = new Vector3(px, 1.7, pz + 2);

  // Animate over ~0.5 seconds with ease-out
  animateTo(target, () => {
    camera.lookAt(px, 1.5, pz);
  });
}
```

### Progressive Texture Loading

**File:** `src/components/virtual-tour/useProgressiveTextures.ts`

Textures load in priority order:

| Priority | Textures | Mobile |
|----------|----------|--------|
| 1 (Essential) | Wood floor, plaster wall | Yes |
| 2 (Important) | Dark wood, doorframe, ceiling | Yes |
| 3 (Enhancement) | Normal maps, roughness maps | No |

Fallback colors render immediately while textures load.

### Mobile Optimizations

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Shadows | Enabled | Disabled |
| DPR | [1, 2] | [1, 1] |
| Antialiasing | Yes | No |
| Far plane | 1000 | 100 |
| Fog range | 25-80 | 15-50 |
| Lights | 12 | 3 |
| Skylights | 7 | 2 |
| Textures | All | Priority 1-2 only |

### Lighting Setup

**Desktop:**
- Ambient light (0.7 intensity, warm white)
- Hemisphere light (sky/ground)
- 2 directional lights (main + fill, with shadows)
- 8 room point lights
- 4 corridor accent lights
- Per-pedestal spotlights

**Mobile:**
- Stronger ambient (1.0)
- Hemisphere light (0.8)
- Single directional (no shadows)
- 2 point lights (Grand Hall + Lobby)

### Info Card Overlay

When near an artifact, displays:
- Artifact name and site
- Material, age, use, context (bilingual)
- AI confidence indicator
- "Your Artifact" badge if personal

### UI Components

- **Loading screen**: Full-screen spinner during initial load
- **Texture progress**: Circular progress while textures load
- **Instructions**: Welcome overlay with controls explanation
- **Teleport button**: "5/16" indicator, cycles through artifacts
- **Exit button**: Returns to /museum page

### Cleanup

```typescript
useEffect(() => {
  return () => {
    // Exit fullscreen
    document.exitFullscreen().catch(() => {});

    // Revoke blob URLs (personal artifact models)
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  };
}, []);
```

---

## File Structure Reference

```
src/
├── pages/
│   ├── VirtualTourPage.tsx      # Main museum experience
│   ├── MuseumPage.tsx           # Landing page / entry point
│   └── GalleryPage.tsx          # My/Public artifacts grid
├── components/
│   ├── virtual-tour/
│   │   ├── ProceduralGallery.tsx # 3D environment
│   │   ├── Controls.tsx          # FirstPerson & Touch controls
│   │   ├── collision.ts          # Collision detection
│   │   ├── useProgressiveTextures.ts
│   │   └── index.ts
│   ├── ui/
│   │   └── UploadProgress.tsx    # Upload status overlay
│   └── museum/
│       ├── MuseumGrid.tsx        # Public artifacts grid
│       └── MuseumCard.tsx        # Artifact card
├── lib/
│   └── firebase/
│       ├── museumService.ts      # Upload/fetch functions
│       ├── uploadQueue.ts        # Retry queue system
│       └── config.ts             # Firebase initialization
├── stores/
│   └── uploadStore.ts            # Upload progress state
└── types/
    └── museum.ts                 # TypeScript interfaces
```

---

## Environment Variables

Required in `.env.local`:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Firebase project config (hardcoded in `config.ts`):
- Project ID: `save-the-past-84518`
- Storage bucket: `save-the-past-84518.firebasestorage.app`

---

## Debugging

### Console Logs

Enable verbose logging by checking for `[Museum Upload]` prefix:

```javascript
// In browser console, filter by:
[Museum Upload]
```

### IndexedDB Inspection

Open DevTools > Application > IndexedDB > `SaveThePastDB`:
- `artifacts` - Local artifact records
- `models` - 3D model blobs
- `pendingUploads` - Upload queue status

### Force Re-sync

From browser console:

```javascript
window.forceResyncAllArtifacts()
```

This resets all artifacts for re-upload (useful if Firestore data was lost).

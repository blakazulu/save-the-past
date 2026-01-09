# Museum Feature Implementation Plan

## Overview

Add a shared "Museum" where all users can browse artifacts created by the community. When a user completes an artifact (status = `complete`), it automatically uploads to Firebase for public viewing.

### What Gets Shared
- **Thumbnail** - Small preview image (~50-100 KB)
- **3D Model** - GLB file (1-10 MB)
- **Info Card** - Text data only (~5 KB)

### What Stays Local Only
- Full-resolution images (privacy + cost savings)
- User metadata/notes
- Draft artifacts

---

## Architecture

```
Local (IndexedDB)                    Firebase
┌─────────────────┐                 ┌─────────────────────────────┐
│ Artifact        │                 │ Firestore: museum_artifacts │
│ - full images   │   on complete   │ - thumbnailUrl              │
│ - thumbnail     │ ───────────────>│ - modelUrl                  │
│ - 3D model      │                 │ - infoCard (embedded)       │
│ - infoCard      │                 │ - metadata (name, site)     │
│                 │                 │ - createdAt                 │
└─────────────────┘                 └─────────────────────────────┘
                                              │
                                    ┌─────────────────────────────┐
                                    │ Storage: museum/            │
                                    │ - thumbnails/{id}.jpg       │
                                    │ - models/{id}.glb           │
                                    └─────────────────────────────┘
```

---

## Firebase Setup

### 1. Create Firebase Project

```bash
npm install firebase
```

### 2. Firebase Services Needed

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **Firestore** | Store artifact metadata + info cards | Free tier: 50K reads/day |
| **Cloud Storage** | Store thumbnails + 3D models | Free tier: 5 GB storage, 1 GB/day download |
| **Anonymous Auth** | Identify devices (optional) | Free |

### 3. Environment Variables

```env
# .env.local
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## Data Schema

### Firestore Collection: `museum_artifacts`

```typescript
interface MuseumArtifact {
  id: string;                    // Same as local artifact ID

  // Display info
  name: string;                  // From metadata.name or "Unnamed Artifact"
  siteName?: string;             // From metadata.siteName
  discoveryLocation?: string;    // From metadata.discoveryLocation

  // File URLs (Firebase Storage)
  thumbnailUrl: string;
  modelUrl: string;
  modelFormat: 'glb' | 'gltf' | 'obj';

  // Embedded info card (denormalized for fast reads)
  infoCard: {
    material: LocalizedText;
    estimatedAge: {
      range: LocalizedText;
      confidence: 'high' | 'medium' | 'low';
    };
    possibleUse: LocalizedText;
    culturalContext: LocalizedText;
    preservationNotes: LocalizedText;
    aiConfidence: number;
  };

  // Metadata
  createdAt: Timestamp;
  deviceId: string;              // Anonymous device identifier

  // Optional: for moderation
  status: 'published' | 'flagged' | 'removed';
}
```

### Storage Structure

```
museum/
├── thumbnails/
│   ├── {artifactId}.jpg        # Max 200x200, JPEG 80% quality
│   └── ...
└── models/
    ├── {artifactId}.glb
    └── ...
```

---

## Implementation Steps

### Phase 1: Firebase Setup

#### 1.1 Create Firebase Config

**File:** `src/lib/firebase/config.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
export const storage = getStorage(app);
```

#### 1.2 Device ID Generation

**File:** `src/lib/firebase/deviceId.ts`

```typescript
const DEVICE_ID_KEY = 'save-the-past-device-id';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
```

---

### Phase 2: Upload Service

#### 2.1 Thumbnail Generation

**File:** `src/lib/firebase/thumbnailGenerator.ts`

```typescript
const THUMBNAIL_SIZE = 200;
const THUMBNAIL_QUALITY = 0.8;

export async function generateThumbnail(sourceBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const scale = Math.min(
        THUMBNAIL_SIZE / img.width,
        THUMBNAIL_SIZE / img.height
      );
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create thumbnail')),
        'image/jpeg',
        THUMBNAIL_QUALITY
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(sourceBlob);
  });
}
```

#### 2.2 Museum Upload Service

**File:** `src/lib/firebase/museumService.ts`

```typescript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from './config';
import { getDeviceId } from './deviceId';
import { generateThumbnail } from './thumbnailGenerator';
import type { Artifact, Model3D, InfoCard } from '@/types';

interface UploadToMuseumParams {
  artifact: Artifact;
  model: Model3D;
  infoCard: InfoCard;
  thumbnailSource: Blob;  // First image or existing thumbnail
}

export async function uploadToMuseum({
  artifact,
  model,
  infoCard,
  thumbnailSource,
}: UploadToMuseumParams): Promise<string> {
  const artifactId = artifact.id;

  // 1. Generate and upload thumbnail
  const thumbnail = await generateThumbnail(thumbnailSource);
  const thumbnailRef = ref(storage, `museum/thumbnails/${artifactId}.jpg`);
  await uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' });
  const thumbnailUrl = await getDownloadURL(thumbnailRef);

  // 2. Upload 3D model
  const modelRef = ref(storage, `museum/models/${artifactId}.${model.format}`);
  await uploadBytes(modelRef, model.blob, {
    contentType: model.format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json'
  });
  const modelUrl = await getDownloadURL(modelRef);

  // 3. Create Firestore document
  const museumDoc = {
    id: artifactId,
    name: artifact.metadata.name || 'Unnamed Artifact',
    siteName: artifact.metadata.siteName || null,
    discoveryLocation: artifact.metadata.discoveryLocation || null,

    thumbnailUrl,
    modelUrl,
    modelFormat: model.format,

    infoCard: {
      material: infoCard.material,
      estimatedAge: {
        range: infoCard.estimatedAge.range,
        confidence: infoCard.estimatedAge.confidence,
      },
      possibleUse: infoCard.possibleUse,
      culturalContext: infoCard.culturalContext,
      preservationNotes: infoCard.preservationNotes,
      aiConfidence: infoCard.aiConfidence,
    },

    createdAt: serverTimestamp(),
    deviceId: getDeviceId(),
    status: 'published',
  };

  await setDoc(doc(firestore, 'museum_artifacts', artifactId), museumDoc);

  return artifactId;
}

export async function removeFromMuseum(artifactId: string): Promise<void> {
  // Soft delete - just update status
  await setDoc(
    doc(firestore, 'museum_artifacts', artifactId),
    { status: 'removed' },
    { merge: true }
  );
}
```

---

### Phase 3: Auto-Upload on Complete

#### 3.1 Update Artifact Store/Hook

When an artifact's status changes to `complete`, trigger upload.

**Modify:** `src/hooks/useGenerateInfoCard.ts` (or wherever status becomes 'complete')

```typescript
import { uploadToMuseum } from '@/lib/firebase/museumService';

// After both 3D model and info card are ready:
async function onArtifactComplete(artifactId: string) {
  const data = await getArtifactWithRelations(artifactId);
  if (!data || !data.model || !data.infoCard) return;

  // Get thumbnail source (first image or existing thumbnail)
  const thumbnailSource = data.artifact.thumbnailBlob
    || data.images[0]?.blob;

  if (!thumbnailSource) return;

  try {
    await uploadToMuseum({
      artifact: data.artifact,
      model: data.model,
      infoCard: data.infoCard,
      thumbnailSource,
    });

    // Mark as uploaded locally
    await db.artifacts.update(artifactId, {
      uploadedToMuseum: true,
      uploadedAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to upload to museum:', error);
    // Queue for retry later
  }
}
```

#### 3.2 Update Artifact Type

**Modify:** `src/types/artifact.ts`

```typescript
export interface Artifact {
  // ... existing fields ...

  // Museum sync status
  uploadedToMuseum?: boolean;
  uploadedAt?: Date;
}
```

---

### Phase 4: Museum Page

#### 4.1 Museum Data Fetching

**File:** `src/lib/firebase/museumQueries.ts`

```typescript
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from './config';

const PAGE_SIZE = 20;

export interface MuseumArtifact {
  id: string;
  name: string;
  siteName?: string;
  thumbnailUrl: string;
  modelUrl: string;
  modelFormat: string;
  infoCard: {
    material: { en: string; he: string };
    estimatedAge: { range: { en: string; he: string }; confidence: string };
    possibleUse: { en: string; he: string };
    culturalContext: { en: string; he: string };
  };
  createdAt: Date;
}

export async function fetchMuseumArtifacts(
  lastDoc?: QueryDocumentSnapshot
): Promise<{ artifacts: MuseumArtifact[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(firestore, 'museum_artifacts'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const artifacts = snapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as MuseumArtifact[];

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { artifacts, lastDoc: newLastDoc };
}
```

#### 4.2 Museum Page Component

**File:** `src/pages/MuseumPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchMuseumArtifacts, type MuseumArtifact } from '@/lib/firebase/museumQueries';

export function MuseumPage() {
  const { t, i18n } = useTranslation();
  const [artifacts, setArtifacts] = useState<MuseumArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMuseumArtifacts()
      .then(({ artifacts }) => setArtifacts(artifacts))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language as 'en' | 'he';

  return (
    <div className="min-h-screen bg-sand">
      <PageHeader title={t('museum.title')} showBack />

      <div className="p-4">
        {loading && <p>{t('common.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {artifacts.map(artifact => (
            <div key={artifact.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={artifact.thumbnailUrl}
                alt={artifact.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-earth truncate">{artifact.name}</h3>
                <p className="text-sm text-text-secondary">
                  {artifact.infoCard.estimatedAge.range[lang]}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {artifact.infoCard.material[lang]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 4.3 Museum Artifact Detail Modal

**File:** `src/components/museum/MuseumArtifactModal.tsx`

A modal/page showing:
- 3D model viewer (load from `modelUrl`)
- Full info card details
- No edit capabilities (read-only)

---

### Phase 5: Navigation & Routes

#### 5.1 Add Route

**Modify:** `src/App.tsx` or router config

```typescript
import { MuseumPage } from '@/pages/MuseumPage';

// Add route
<Route path="/museum" element={<MuseumPage />} />
```

#### 5.2 Add to Bottom Navigation

**Modify:** `src/components/layout/BottomNav.tsx`

Add museum icon/link alongside existing navigation.

---

### Phase 6: Firebase Security Rules

#### 6.1 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /museum_artifacts/{artifactId} {
      // Anyone can read published artifacts
      allow read: if resource.data.status == 'published';

      // Anyone can create (auto-upload)
      allow create: if request.resource.data.status == 'published'
                    && request.resource.data.thumbnailUrl is string
                    && request.resource.data.modelUrl is string;

      // Only the original device can update/delete
      allow update, delete: if request.resource.data.deviceId == resource.data.deviceId;
    }
  }
}
```

#### 6.2 Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /museum/{allPaths=**} {
      // Anyone can read
      allow read: if true;

      // Anyone can upload (size limits enforced)
      allow write: if request.resource.size < 15 * 1024 * 1024  // 15 MB max
                   && (request.resource.contentType.matches('image/jpeg')
                       || request.resource.contentType.matches('model/gltf.*'));
    }
  }
}
```

---

## Offline Handling & Retry

### Queue Failed Uploads

**File:** `src/lib/firebase/uploadQueue.ts`

```typescript
// Store failed uploads in IndexedDB
// Retry on app startup and when online status changes

interface PendingUpload {
  artifactId: string;
  attempts: number;
  lastAttempt: Date;
}

// Add to Dexie schema
// pendingUploads: 'artifactId, attempts'

export async function retryPendingUploads() {
  const pending = await db.pendingUploads.toArray();

  for (const upload of pending) {
    if (upload.attempts >= 3) continue; // Give up after 3 attempts

    try {
      const data = await getArtifactWithRelations(upload.artifactId);
      if (data?.model && data?.infoCard) {
        await uploadToMuseum({ ... });
        await db.pendingUploads.delete(upload.artifactId);
      }
    } catch {
      await db.pendingUploads.update(upload.artifactId, {
        attempts: upload.attempts + 1,
        lastAttempt: new Date(),
      });
    }
  }
}

// Call on app init and online event
window.addEventListener('online', retryPendingUploads);
```

---

## Cost Estimation

### Firebase Free Tier (Spark Plan)

| Resource | Free Limit | Estimated Usage |
|----------|------------|-----------------|
| Firestore reads | 50K/day | ~5K/day (museum browsing) |
| Firestore writes | 20K/day | ~100/day (new artifacts) |
| Storage | 5 GB | ~500 artifacts at 10 MB each |
| Storage bandwidth | 1 GB/day | ~200 views/day with 3D models |

### When to Upgrade (Blaze Plan)

- More than 500 artifacts
- More than 200 daily active users
- Estimated cost: $5-25/month for moderate usage

---

## Implementation Checklist

### Phase 1: Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Firestore and Storage
- [ ] Add environment variables
- [ ] Create `src/lib/firebase/config.ts`
- [ ] Create device ID utility

### Phase 2: Upload Service
- [ ] Create thumbnail generator
- [ ] Create museum upload service
- [ ] Add upload queue for offline retry

### Phase 3: Auto-Upload Integration
- [ ] Modify artifact completion flow
- [ ] Add `uploadedToMuseum` field to Artifact type
- [ ] Update Dexie schema version

### Phase 4: Museum UI
- [ ] Create `MuseumPage` component
- [ ] Create museum artifact card component
- [ ] Create museum artifact detail modal
- [ ] Add 3D viewer for museum artifacts

### Phase 5: Navigation
- [ ] Add `/museum` route
- [ ] Add museum link to bottom nav
- [ ] Add i18n keys for museum strings

### Phase 6: Security & Polish
- [ ] Configure Firestore security rules
- [ ] Configure Storage security rules
- [ ] Add loading states and error handling
- [ ] Test offline upload retry

---

## Future Enhancements

1. **Search & Filter** - Search by material, age, site name
2. **Favorites** - Users can save artifacts to a local favorites list
3. **Moderation** - Admin panel to review/remove inappropriate content
4. **User Profiles** - Optional accounts to see "my contributions"
5. **Social Features** - Comments, likes, sharing
6. **Map View** - Show artifacts on a map by discovery location

import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestoreDb, getFirebaseStorage } from './config';
import { toMuseumInfoCard, type MuseumArtifact } from '@/types/museum';
import { optimizeModel } from './modelOptimizer';
import type { Artifact, Model3D, InfoCard } from '@/types';

const DEVICE_ID_KEY = 'save-the-past-device-id';

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Generate a smaller thumbnail from a source blob
async function generateThumbnail(sourceBlob: Blob, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          blob ? resolve(blob) : reject(new Error('Failed to create thumbnail'));
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(sourceBlob);
  });
}

export interface UploadToMuseumParams {
  artifact: Artifact;
  model?: Model3D;
  infoCard?: InfoCard;
  thumbnailSource: Blob;
}

export async function uploadToMuseum({
  artifact,
  model,
  infoCard,
  thumbnailSource,
}: UploadToMuseumParams): Promise<string> {
  const storage = getFirebaseStorage();
  const firestore = getFirestoreDb();
  const artifactId = artifact.id;

  // 1. Generate and upload thumbnail
  const thumbnail = await generateThumbnail(thumbnailSource);
  const thumbnailRef = ref(storage, `museum/thumbnails/${artifactId}.jpg`);
  await uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' });
  const thumbnailUrl = await getDownloadURL(thumbnailRef);

  // 2. Upload 3D model (if exists)
  let modelUrl = '';
  let modelFormat: 'glb' | 'gltf' | 'obj' = 'glb';
  if (model?.blob) {
    // Optimize GLB models before upload (reduces size by 50-70%)
    const modelBlob = model.format === 'glb'
      ? await optimizeModel(model.blob)
      : model.blob;

    const modelRef = ref(storage, `museum/models/${artifactId}.${model.format}`);
    await uploadBytes(modelRef, modelBlob, {
      contentType: model.format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
    });
    modelUrl = await getDownloadURL(modelRef);
    modelFormat = model.format;
  }

  // 3. Create Firestore document
  const museumDoc = {
    localArtifactId: artifactId,
    name: artifact.metadata.name || 'Unnamed Artifact',
    siteName: artifact.metadata.siteName || null,
    discoveryLocation: artifact.metadata.discoveryLocation || null,

    thumbnailUrl,
    modelUrl,
    modelFormat,

    infoCard: infoCard ? toMuseumInfoCard(infoCard) : null,

    createdAt: serverTimestamp(),
    deviceId: getDeviceId(),
    status: 'published',
  };

  await setDoc(doc(firestore, 'museum_artifacts', artifactId), museumDoc);

  return artifactId;
}

export async function fetchMuseumArtifacts(maxResults = 50): Promise<MuseumArtifact[]> {
  const firestore = getFirestoreDb();

  const q = query(
    collection(firestore, 'museum_artifacts'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      localArtifactId: data.localArtifactId,
      name: data.name,
      siteName: data.siteName,
      discoveryLocation: data.discoveryLocation,
      thumbnailUrl: data.thumbnailUrl,
      modelUrl: data.modelUrl,
      modelFormat: data.modelFormat,
      infoCard: data.infoCard,
      createdAt: data.createdAt?.toDate() || new Date(),
      deviceId: data.deviceId,
      status: data.status,
    } as MuseumArtifact;
  });
}

export async function fetchMuseumArtifactById(id: string): Promise<MuseumArtifact | null> {
  const firestore = getFirestoreDb();
  const docRef = doc(firestore, 'museum_artifacts', id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    localArtifactId: data.localArtifactId,
    name: data.name,
    siteName: data.siteName,
    discoveryLocation: data.discoveryLocation,
    thumbnailUrl: data.thumbnailUrl,
    modelUrl: data.modelUrl,
    modelFormat: data.modelFormat,
    infoCard: data.infoCard,
    createdAt: data.createdAt?.toDate() || new Date(),
    deviceId: data.deviceId,
    status: data.status,
  } as MuseumArtifact;
}

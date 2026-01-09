import type { InfoCard, LocalizedText } from './artifact';

export interface MuseumArtifact {
  id: string; // Firestore document ID
  localArtifactId: string; // Reference to local IndexedDB artifact

  // Display info
  name: string;
  siteName?: string;
  discoveryLocation?: string;

  // Firebase Storage URLs
  thumbnailUrl: string;
  modelUrl: string;
  modelFormat: 'glb' | 'gltf' | 'obj';

  // Embedded info card (denormalized for fast reads)
  infoCard?: {
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
  createdAt: Date;
  deviceId: string;

  // Status for moderation (future)
  status: 'published' | 'flagged' | 'removed';
}

export interface PendingMuseumUpload {
  id: string;
  artifactId: string;
  status: 'pending' | 'uploading' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}

// Convert local InfoCard to museum format
export function toMuseumInfoCard(infoCard: InfoCard): MuseumArtifact['infoCard'] {
  return {
    material: infoCard.material,
    estimatedAge: {
      range: infoCard.estimatedAge.range,
      confidence: infoCard.estimatedAge.confidence,
    },
    possibleUse: infoCard.possibleUse,
    culturalContext: infoCard.culturalContext,
    preservationNotes: infoCard.preservationNotes,
    aiConfidence: infoCard.aiConfidence,
  };
}

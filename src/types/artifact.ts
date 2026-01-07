export type ArtifactStatus =
  | 'draft'
  | 'images-captured'
  | 'processing-3d'
  | 'processing-info'
  | 'complete'
  | 'error';

export type ImageAngle =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'detail'
  | 'context';

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

export interface LocalizedText {
  en: string;
  he: string;
}

export interface InfoCard {
  id: string;
  artifactId: string;
  createdAt: Date;
  updatedAt: Date;
  material: LocalizedText;
  estimatedAge: {
    range: LocalizedText;
    confidence: 'high' | 'medium' | 'low';
    reasoning?: LocalizedText;
  };
  possibleUse: LocalizedText;
  culturalContext: LocalizedText;
  similarArtifacts: LocalizedText[];
  preservationNotes: LocalizedText;
  aiModel: string;
  aiConfidence: number;
  isHumanEdited: boolean;
  disclaimer: LocalizedText;
}

export interface ProcessingStatus {
  type: '3d-reconstruction' | 'info-generation';
  progress: number;
  message?: string;
  error?: string;
}

export interface CaptureImage {
  id: string;
  blob: Blob;
  angle: ImageAngle;
  previewUrl: string;
}

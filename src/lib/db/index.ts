import Dexie, { type Table } from 'dexie';
import type { Artifact, ArtifactImage, Model3D, InfoCard } from '@/types';

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

// Helper functions for common database operations
export async function getArtifactWithRelations(artifactId: string) {
  const artifact = await db.artifacts.get(artifactId);
  if (!artifact) return null;

  const images = await db.images.where('artifactId').equals(artifactId).toArray();
  const model = artifact.model3DId
    ? await db.models.get(artifact.model3DId)
    : undefined;
  const infoCard = artifact.infoCardId
    ? await db.infoCards.get(artifact.infoCardId)
    : undefined;

  return {
    artifact,
    images,
    model,
    infoCard,
  };
}

export async function deleteArtifactWithRelations(artifactId: string) {
  await db.transaction('rw', [db.artifacts, db.images, db.models, db.infoCards], async () => {
    const artifact = await db.artifacts.get(artifactId);
    if (!artifact) return;

    // Delete related images
    await db.images.where('artifactId').equals(artifactId).delete();

    // Delete related model
    if (artifact.model3DId) {
      await db.models.delete(artifact.model3DId);
    }

    // Delete related info card
    if (artifact.infoCardId) {
      await db.infoCards.delete(artifact.infoCardId);
    }

    // Delete the artifact
    await db.artifacts.delete(artifactId);
  });
}

export async function getAllArtifactsSorted(
  sortBy: 'createdAt' | 'updatedAt' = 'updatedAt',
  order: 'asc' | 'desc' = 'desc'
) {
  const artifacts = await db.artifacts.orderBy(sortBy).toArray();
  return order === 'desc' ? artifacts.reverse() : artifacts;
}

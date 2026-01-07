import { ArtifactCard } from './ArtifactCard';
import type { Artifact } from '@/types';

interface GalleryListProps {
  artifacts: Artifact[];
}

export function GalleryList({ artifacts }: GalleryListProps) {
  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} variant="list" />
      ))}
    </div>
  );
}

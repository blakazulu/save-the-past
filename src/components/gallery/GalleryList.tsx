import { ArtifactCard } from './ArtifactCard';
import type { Artifact } from '@/types';

interface GalleryListProps {
  artifacts: Artifact[];
  onDelete?: (artifact: Artifact) => void;
}

export function GalleryList({ artifacts, onDelete }: GalleryListProps) {
  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} variant="list" onDelete={onDelete} />
      ))}
    </div>
  );
}

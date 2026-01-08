import { ArtifactCard } from './ArtifactCard';
import type { Artifact } from '@/types';

interface GalleryGridProps {
  artifacts: Artifact[];
  onDelete?: (artifact: Artifact) => void;
}

export function GalleryGrid({ artifacts, onDelete }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} variant="grid" onDelete={onDelete} />
      ))}
    </div>
  );
}

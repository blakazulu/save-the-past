import { MuseumCard } from './MuseumCard';
import type { MuseumArtifact } from '@/types/museum';

interface MuseumGridProps {
  artifacts: MuseumArtifact[];
}

export function MuseumGrid({ artifacts }: MuseumGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {artifacts.map((artifact) => (
        <MuseumCard key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}

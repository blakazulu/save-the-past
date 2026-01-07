interface GallerySkeletonProps {
  variant?: 'grid' | 'list';
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-sand" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-sand rounded w-3/4" />
        <div className="h-3 bg-sand rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-sand flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-sand rounded w-1/2" />
        <div className="h-3 bg-sand rounded w-1/4" />
      </div>
      <div className="h-6 w-16 bg-sand rounded-full" />
    </div>
  );
}

export function GallerySkeleton({ variant = 'grid', count = 6 }: GallerySkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {items.map((i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

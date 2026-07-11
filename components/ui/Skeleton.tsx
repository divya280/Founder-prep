// Loading skeletons — a single pulsing block primitive plus a couple of common
// compositions. Colour matches the app's muted greys so they read as content
// placeholders, not errors.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e4e8e0] ${className}`} />;
}

/** A card-shaped placeholder — used while widgets/lists load. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border border-[#d9ded4] bg-white p-5 shadow-sm ${className}`}
    >
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="mt-3 h-3 w-2/3 rounded" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded" />
    </div>
  );
}

/** N stacked card skeletons. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

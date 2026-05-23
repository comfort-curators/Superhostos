export const LoadingSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx.toString()} className="h-12 animate-pulse rounded-2xl border border-stone-200 bg-stone-100" />
    ))}
  </div>
);

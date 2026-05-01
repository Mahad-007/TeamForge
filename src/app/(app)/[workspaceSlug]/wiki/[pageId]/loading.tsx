import { Skeleton } from "@/components/ui/skeleton";

export default function WikiPageLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <Skeleton className="h-8 w-64" />

      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${60 + (i % 4) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

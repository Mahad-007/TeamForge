import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="space-y-6">
      {/* Project header / tabs */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* Content area */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

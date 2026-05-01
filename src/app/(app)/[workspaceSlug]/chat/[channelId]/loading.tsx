import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Channel header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton
                className="h-4"
                style={{ width: `${140 + (i % 3) * 80}px` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

"use client";

export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-lg font-semibold">Failed to load channel</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

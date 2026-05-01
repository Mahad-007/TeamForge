import Link from "next/link";

export default function WorkspaceNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Workspace not found</h2>
        <p className="mt-2 text-muted-foreground">
          The workspace you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

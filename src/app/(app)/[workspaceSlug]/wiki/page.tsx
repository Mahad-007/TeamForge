import { BookOpen } from "lucide-react";

export const metadata = { title: "Wiki - TeamForge" };

export default function WikiPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center text-muted-foreground">
        <BookOpen className="mx-auto h-12 w-12" />
        <h2 className="mt-4 text-lg font-medium">Select a page</h2>
        <p className="text-sm">
          Choose a page from the sidebar or create a new one.
        </p>
      </div>
    </div>
  );
}

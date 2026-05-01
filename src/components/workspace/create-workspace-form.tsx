"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("workspaces").insert({
      name,
      slug,
      owner_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        setError("A workspace with this URL slug already exists");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Use full-page navigation to ensure server components pick up the new workspace
    window.location.href = `/${slug}/dashboard`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          type="text"
          placeholder="My Team"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ws-slug">URL slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">teamforge.app/</span>
          <Input
            id="ws-slug"
            type="text"
            placeholder="my-team"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugEdited(true);
            }}
            required
            pattern="[a-z0-9-]+"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !name || !slug}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create workspace
      </Button>
    </form>
  );
}

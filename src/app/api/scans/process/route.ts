import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processScan } from "@/lib/scanning";

export async function POST(req: Request) {
  try {
    const { scanId } = await req.json();

    if (!scanId) {
      return NextResponse.json(
        { error: "scanId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get GitHub token from workspace settings
    const { data: scan } = await supabase
      .from("repository_scans")
      .select("project:projects(workspace_id)")
      .eq("id", scanId)
      .single();

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const project = scan.project as { workspace_id: string };
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("settings")
      .eq("id", project.workspace_id)
      .single();

    const settings = (workspace?.settings ?? {}) as Record<string, string>;
    const githubToken =
      settings.github_token ?? process.env.GITHUB_API_TOKEN ?? "";

    if (!githubToken) {
      await supabase
        .from("repository_scans")
        .update({
          status: "failed",
          error_message: "No GitHub token configured",
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanId);

      return NextResponse.json(
        { error: "No GitHub token configured" },
        { status: 400 }
      );
    }

    // Process scan asynchronously (won't block response)
    processScan(scanId, supabase, githubToken).catch(console.error);

    return NextResponse.json({ status: "processing", scanId });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

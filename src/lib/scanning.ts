import { GitHubClient, parseRepoUrl } from "./github";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ScanResults {
  metrics: {
    total_files: number;
    languages: Record<string, number>;
    largest_files: Array<{ path: string; size: number }>;
  };
  git_stats: {
    total_commits: number;
    recent_commits: number;
    contributors: number;
    open_prs: number;
  };
  ai_analysis?: {
    overall_quality_score: number;
    summary: string;
    strengths: string[];
    issues: Array<{
      severity: string;
      category: string;
      file: string;
      description: string;
    }>;
  };
}

export async function processScan(
  scanId: string,
  supabase: SupabaseClient,
  githubToken: string
) {
  // Update status to running
  await supabase
    .from("repository_scans")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", scanId);

  try {
    // Get scan details
    const { data: scan } = await supabase
      .from("repository_scans")
      .select("*, project:projects(github_repo_url)")
      .eq("id", scanId)
      .maybeSingle();

    if (!scan) throw new Error("Scan not found");

    const project = scan.project as { github_repo_url: string | null };
    if (!project?.github_repo_url) throw new Error("No GitHub repo linked");

    const parsed = parseRepoUrl(project.github_repo_url);
    if (!parsed) throw new Error("Invalid GitHub repo URL");

    const github = new GitHubClient(githubToken);
    const { owner, repo } = parsed;

    // Fetch data in parallel
    const [repoInfo, tree, commits, prs, contributors] = await Promise.all([
      github.getRepo(owner, repo),
      github.getTree(owner, repo, scan.branch ?? "main").catch(() => []),
      github.getRecentCommits(
        owner,
        repo,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ).catch(() => []),
      github.getOpenPRs(owner, repo).catch(() => []),
      github.getContributors(owner, repo).catch(() => []),
    ]);

    // Calculate metrics
    const languageMap: Record<string, number> = {};
    const fileSizes: Array<{ path: string; size: number }> = [];

    for (const item of tree) {
      if (item.type === "blob" && item.path) {
        const ext = item.path.split(".").pop()?.toLowerCase() ?? "other";
        languageMap[ext] = (languageMap[ext] ?? 0) + 1;
        if (item.size) {
          fileSizes.push({ path: item.path, size: item.size });
        }
      }
    }

    fileSizes.sort((a, b) => b.size - a.size);

    const results: ScanResults = {
      metrics: {
        total_files: tree.filter((t) => t.type === "blob").length,
        languages: languageMap,
        largest_files: fileSizes.slice(0, 10),
      },
      git_stats: {
        total_commits: 0, // Would need stats API
        recent_commits: commits.length,
        contributors: contributors.length,
        open_prs: prs.length,
      },
    };

    // Get commit SHA
    const latestSha = commits.length > 0 ? commits[0].sha : null;

    // Update scan as completed
    await supabase
      .from("repository_scans")
      .update({
        status: "completed",
        results,
        commit_sha: latestSha,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    return results;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scan error";

    await supabase
      .from("repository_scans")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    throw error;
  }
}

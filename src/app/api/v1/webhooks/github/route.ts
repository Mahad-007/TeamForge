import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBulkNotifications } from "@/lib/notifications";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    // 1. Read signature and event type headers
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    if (!signature || !event) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // 2. Read raw body for signature verification
    const rawBody = await request.text();

    // 3. Verify HMAC-SHA256 signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("GITHUB_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 4. Parse the JSON body
    const payload = JSON.parse(rawBody);

    // 5. Handle events based on type
    switch (event) {
      case "push": {
        await handlePushEvent(supabase, payload);
        break;
      }
      case "pull_request": {
        await handlePullRequestEvent(supabase, payload);
        break;
      }
      case "pull_request_review": {
        await handlePullRequestReviewEvent(supabase, payload);
        break;
      }
      case "ping": {
        // GitHub sends a ping event when a webhook is first configured
        break;
      }
      default: {
        console.log(`Unhandled GitHub event: ${event}`);
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Return 200 even on non-critical failures to prevent GitHub retries
    console.error("GitHub webhook error:", error);
    return NextResponse.json({ ok: true, warning: "Processed with errors" });
  }
}

async function handlePushEvent(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    repository?: { full_name?: string };
    ref?: string;
    after?: string;
  }
) {
  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) return;

  // Find matching project by github_repo_url
  const { data: project } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .ilike("github_repo_url", `%${repoFullName}%`)
    .single();

  if (!project) {
    console.log(`No project found for repository: ${repoFullName}`);
    return;
  }

  // Find a workspace member to attribute the scan to
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", project.workspace_id)
    .limit(1)
    .single();

  if (!member) return;

  // Create a repository scan record
  const { error } = await supabase.from("repository_scans").insert({
    project_id: project.id,
    triggered_by: member.id,
    trigger_type: "webhook",
    branch: payload.ref?.replace("refs/heads/", "") ?? "main",
    commit_sha: payload.after ?? null,
  });

  if (error) {
    console.error("Failed to create repository scan:", error);
  }
}

async function handlePullRequestEvent(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    action?: string;
    pull_request?: { title?: string; html_url?: string; number?: number };
    repository?: { full_name?: string };
  }
) {
  const repoFullName = payload.repository?.full_name;
  const pr = payload.pull_request;
  if (!repoFullName || !pr) return;

  // Only notify on opened, closed, and merged actions
  const notifyActions = ["opened", "closed", "reopened"];
  if (!notifyActions.includes(payload.action ?? "")) return;

  // Find matching project
  const { data: project } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .ilike("github_repo_url", `%${repoFullName}%`)
    .single();

  if (!project) return;

  // Get all workspace members for this project to notify
  const { data: members } = await supabase
    .from("workspace_members")
    .select("id, user_id")
    .eq("workspace_id", project.workspace_id);

  if (!members || members.length === 0) return;

  const notifications = members
    .filter((m) => m.user_id != null)
    .map((member) => ({
      workspace_id: project.workspace_id,
      user_id: member.user_id!,
      type: "project_update" as const,
      title: `PR #${pr.number} ${payload.action}: ${pr.title}`,
      body: pr.html_url ?? undefined,
      entity_type: "project",
      entity_id: project.id,
    }));

  await createBulkNotifications(supabase, notifications);
}

async function handlePullRequestReviewEvent(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    action?: string;
    review?: { state?: string; user?: { login?: string } };
    pull_request?: {
      title?: string;
      html_url?: string;
      number?: number;
      user?: { login?: string };
    };
    repository?: { full_name?: string };
  }
) {
  if (payload.action !== "submitted") return;

  const repoFullName = payload.repository?.full_name;
  const pr = payload.pull_request;
  const review = payload.review;
  if (!repoFullName || !pr || !review) return;

  // Find matching project
  const { data: project } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .ilike("github_repo_url", `%${repoFullName}%`)
    .single();

  if (!project) return;

  // Notify all project members about the review
  // (In a more complete implementation, we would match the PR author's GitHub
  // login to a workspace member. For now, notify all members.)
  const { data: members } = await supabase
    .from("workspace_members")
    .select("id, user_id")
    .eq("workspace_id", project.workspace_id);

  if (!members || members.length === 0) return;

  const reviewState = review.state ?? "commented";
  const reviewer = review.user?.login ?? "Someone";

  const notifications = members
    .filter((m) => m.user_id != null)
    .map((member) => ({
      workspace_id: project.workspace_id,
      user_id: member.user_id!,
      type: "project_update" as const,
      title: `${reviewer} ${reviewState} PR #${pr.number}: ${pr.title}`,
      body: pr.html_url ?? undefined,
      entity_type: "project",
      entity_id: project.id,
    }));

  await createBulkNotifications(supabase, notifications);
}

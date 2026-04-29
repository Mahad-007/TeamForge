import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, apiCreated, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { id: projectId } = await params;
    const supabase = createAdminClient();

    const { data, error, count } = await supabase
      .from("bugs")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .order("severity")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return apiSuccess(data, { total: count });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { id: projectId } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const { data: member } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from("bugs")
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        title: body.title,
        description: body.description,
        severity: body.severity ?? "minor",
        priority: body.priority ?? "medium",
        assignee_id: body.assignee_id,
        reporter_id: member!.id,
        environment: body.environment,
        related_task_id: body.related_task_id,
      })
      .select()
      .single();

    if (error) throw error;
    return apiCreated(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

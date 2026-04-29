import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, apiCreated, handleAPIError } from "@/lib/api/response";
import { parsePagination } from "@/lib/api/pagination";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { id: projectId } = await params;
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const { limit, sort, order } = parsePagination(searchParams);

    let query = supabase
      .from("tasks")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .order(sort, { ascending: order === "asc" })
      .limit(limit);

    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee_id");
    const priority = searchParams.get("priority");
    if (status) query = query.eq("status", status);
    if (assignee) query = query.eq("assignee_id", assignee);
    if (priority) query = query.eq("priority", priority);

    const { data, error, count } = await query;
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
      .from("tasks")
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        title: body.title,
        description: body.description,
        status: body.status ?? "Backlog",
        priority: body.priority ?? "none",
        type: body.type ?? "task",
        assignee_id: body.assignee_id,
        reporter_id: member!.id,
        labels: body.labels,
        due_date: body.due_date,
        estimated_hours: body.estimated_hours,
        parent_task_id: body.parent_task_id,
      })
      .select()
      .single();

    if (error) throw error;
    return apiCreated(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

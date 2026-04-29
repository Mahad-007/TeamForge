import { authenticateAPIKey } from "@/lib/api/auth";
import { apiCreated, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { identifier } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    // Find the task
    const { data: task } = await supabase
      .from("tasks")
      .select("id, assignee_id")
      .eq("identifier", identifier.toUpperCase())
      .eq("workspace_id", workspaceId)
      .single();

    if (!task) throw new Error("Task not found");

    // Find the user_id from assignee
    let userId: string | undefined;
    if (task.assignee_id) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("id", task.assignee_id)
        .single();
      userId = member?.user_id;
    }

    if (!userId) {
      // Fallback to first workspace member
      const { data: m } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .single();
      userId = m?.user_id;
    }

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        workspace_id: workspaceId,
        user_id: userId!,
        task_id: task.id,
        message: body.message,
        remind_at: body.remind_at,
      })
      .select()
      .single();

    if (error) throw error;
    return apiCreated(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

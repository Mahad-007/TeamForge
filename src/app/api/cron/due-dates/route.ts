import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Tasks due within 24 hours (not completed)
  const { data: dueSoon } = await supabase
    .from("tasks")
    .select("id, identifier, title, workspace_id, assignee_id, assignee:workspace_members!tasks_assignee_id_fkey(user_id)")
    .is("completed_at", null)
    .gte("due_date", now.toISOString())
    .lte("due_date", tomorrow.toISOString());

  // Overdue tasks (not completed, due_date < now)
  const { data: overdue } = await supabase
    .from("tasks")
    .select("id, identifier, title, workspace_id, assignee_id, assignee:workspace_members!tasks_assignee_id_fkey(user_id)")
    .is("completed_at", null)
    .lt("due_date", now.toISOString())
    .not("assignee_id", "is", null);

  let notified = 0;

  // Notify due-soon tasks
  for (const task of dueSoon ?? []) {
    const userId = (task.assignee as unknown as { user_id: string })?.user_id;
    if (!userId) continue;

    await createNotification(supabase, {
      workspace_id: task.workspace_id,
      user_id: userId,
      type: "task_due_soon",
      title: `Task "${task.identifier}" is due tomorrow`,
      body: task.title,
      entity_type: "task",
      entity_id: task.id,
    });
    notified++;
  }

  // Notify overdue tasks
  for (const task of overdue ?? []) {
    const userId = (task.assignee as unknown as { user_id: string })?.user_id;
    if (!userId) continue;

    await createNotification(supabase, {
      workspace_id: task.workspace_id,
      user_id: userId,
      type: "task_overdue",
      title: `Task "${task.identifier}" is overdue`,
      body: task.title,
      entity_type: "task",
      entity_id: task.id,
    });
    notified++;
  }

  return NextResponse.json({
    due_soon: dueSoon?.length ?? 0,
    overdue: overdue?.length ?? 0,
    notified,
  });
}

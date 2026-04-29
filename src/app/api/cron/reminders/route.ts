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

  // Fetch due reminders
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("is_sent", false)
    .lte("remind_at", new Date().toISOString())
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  for (const reminder of reminders ?? []) {
    await createNotification(supabase, {
      workspace_id: reminder.workspace_id,
      user_id: reminder.user_id,
      type: "reminder",
      title: `Reminder: ${reminder.message}`,
      entity_type: "task",
      entity_id: reminder.task_id ?? undefined,
    });

    await supabase
      .from("reminders")
      .update({ is_sent: true })
      .eq("id", reminder.id);

    processed++;
  }

  return NextResponse.json({ processed });
}

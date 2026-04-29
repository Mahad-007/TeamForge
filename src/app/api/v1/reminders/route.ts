import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_sent", false)
      .order("remind_at", { ascending: true });

    if (error) throw error;
    return apiSuccess(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("workspace_members")
      .select("id, display_name, user_id, status, joined_at, role:roles(name, color)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("display_name");

    if (error) throw error;
    return apiSuccess(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    if (!query) {
      return apiSuccess({ tasks: [], bugs: [] });
    }

    const { data, error } = await supabase.rpc("search_workspace", {
      ws_id: workspaceId,
      search_query: query,
      search_type: type ?? undefined,
      result_limit: Math.min(limit, 50),
    });

    if (error) throw error;
    return apiSuccess(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, apiCreated, handleAPIError } from "@/lib/api/response";
import { parsePagination } from "@/lib/api/pagination";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const { limit, sort, order } = parsePagination(searchParams);

    const { data, error, count } = await supabase
      .from("projects")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .neq("status", "archived")
      .order(sort, { ascending: order === "asc" })
      .limit(limit);

    if (error) throw error;
    return apiSuccess(data, { total: count });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const supabase = createAdminClient();
    const body = await req.json();

    const { data: member } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        status: body.status ?? "planning",
        priority: body.priority ?? "medium",
        start_date: body.start_date,
        target_date: body.target_date,
        created_by: member!.id,
        lead_id: body.lead_id,
      })
      .select()
      .single();

    if (error) throw error;
    return apiCreated(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

import { authenticateAPIKey } from "@/lib/api/auth";
import { apiSuccess, apiNoContent, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { identifier } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("identifier", identifier.toUpperCase())
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
    return apiSuccess(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { identifier } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("tasks")
      .update(body)
      .eq("identifier", identifier.toUpperCase())
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return apiSuccess(data);
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const { identifier } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("identifier", identifier.toUpperCase())
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return apiNoContent();
  } catch (error) {
    return handleAPIError(error);
  }
}

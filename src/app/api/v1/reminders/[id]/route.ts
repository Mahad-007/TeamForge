import { authenticateAPIKey } from "@/lib/api/auth";
import { apiNoContent, handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authenticateAPIKey(req);
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return apiNoContent();
  } catch (error) {
    return handleAPIError(error);
  }
}

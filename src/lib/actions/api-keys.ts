import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateAPIKey(
  workspaceId: string,
  createdBy: string,
  name: string,
  permissions?: Record<string, boolean>
): Promise<{ key: string; id: string }> {
  const supabase = createAdminClient();

  // Generate key: tf_live_ + 64 hex chars
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const fullKey = `tf_live_${randomBytes}`;

  // Hash for storage
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = randomBytes.slice(0, 8);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: permissions ?? { all: true },
    })
    .select("id")
    .single();

  if (error) throw error;

  return { key: fullKey, id: data.id };
}

export async function revokeAPIKey(keyId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId);

  if (error) throw error;
}

export async function deleteAPIKey(keyId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId);

  if (error) throw error;
}

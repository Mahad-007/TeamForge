import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

interface APIKeyAuth {
  workspaceId: string;
  permissions: Record<string, boolean>;
  keyId: string;
}

export async function authenticateAPIKey(
  request: Request
): Promise<APIKeyAuth> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new APIError("UNAUTHORIZED", "Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  if (!token.startsWith("tf_live_")) {
    throw new APIError("UNAUTHORIZED", "Invalid API key format", 401);
  }

  const prefix = token.slice(8, 16); // 8 chars after "tf_live_"
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const supabase = createAdminClient();
  const { data: key, error } = await supabase
    .from("api_keys")
    .select("id, workspace_id, permissions, is_active, expires_at")
    .eq("key_prefix", prefix)
    .eq("key_hash", hash)
    .single();

  if (error || !key) {
    throw new APIError("UNAUTHORIZED", "Invalid API key", 401);
  }

  if (!key.is_active) {
    throw new APIError("UNAUTHORIZED", "API key is deactivated", 401);
  }

  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    throw new APIError("UNAUTHORIZED", "API key has expired", 401);
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    workspaceId: key.workspace_id,
    permissions: (key.permissions ?? { all: true }) as Record<string, boolean>,
    keyId: key.id,
  };
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "APIError";
  }
}

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type WebhookEvent =
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "bug.created"
  | "bug.resolved"
  | "scan.completed"
  | "member.joined";

export async function fireWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  const supabase = createAdminClient();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .contains("events", [event]);

  if (!webhooks || webhooks.length === 0) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  for (const webhook of webhooks) {
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");

    // Fire and forget with retry
    deliverWebhook(webhook.url, body, signature, event).catch(console.error);
  }
}

async function deliverWebhook(
  url: string,
  body: string,
  signature: string,
  event: string,
  attempt = 1
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TeamForge-Signature": `sha256=${signature}`,
        "X-TeamForge-Event": event,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok && attempt < 3) {
      // Exponential backoff retry
      await new Promise((r) => setTimeout(r, attempt * 2000));
      return deliverWebhook(url, body, signature, event, attempt + 1);
    }
  } catch (error) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
      return deliverWebhook(url, body, signature, event, attempt + 1);
    }
    console.error(`Webhook delivery failed after 3 attempts: ${url}`, error);
  }
}

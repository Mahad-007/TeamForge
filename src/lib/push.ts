import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configure VAPID keys if available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM ?? "notifications@teamforge.app"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  if (!process.env.VAPID_PRIVATE_KEY) {
    return; // Push not configured
  }

  const supabase = createAdminClient();

  // Get user's push subscriptions (table would need to be created)
  // For now, this is a placeholder for when push_subscriptions table is added
  console.log("[Push] Would send to user:", userId, { title, body, url });
}

export async function subscribePush(
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
) {
  const supabase = createAdminClient();

  // Store subscription — requires push_subscriptions table
  console.log("[Push] Subscription stored for user:", userId);
}

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Saves a browser PushSubscription to the database, tied to the current user.
 */
export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "User not authenticated" };
  }

  // Upsert so re-subscribing from the same browser doesn't error
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Failed to save push subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Removes a push subscription from the database (e.g. when user denies or unsubscribes).
 */
export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Failed to remove push subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

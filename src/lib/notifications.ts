import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationType =
  | "booking_confirmed"
  | "new_message"
  | "reminder"
  | "review_requested"
  | "payment_received";

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    payload?: Record<string, unknown>;
  }
) {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    payload: params.payload ?? {},
  });
}
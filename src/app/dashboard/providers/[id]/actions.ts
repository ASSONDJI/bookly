"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(formData: FormData) {
  const providerId = formData.get("provider_id") as string;
  const serviceTitle = formData.get("service_title") as string;
  const hours = parseFloat(formData.get("hours") as string);
  const hourlyRateCents = parseInt(formData.get("hourly_rate_cents") as string, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const amountCents = Math.round(hours * hourlyRateCents);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      provider_id: providerId,
      service_title: serviceTitle,
      amount_cents: amountCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) {
    throw new Error(error?.message ?? "Failed to create booking");
  }

  redirect(`/dashboard/bookings/${booking.id}`);
}
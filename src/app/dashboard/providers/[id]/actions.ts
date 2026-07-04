"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/email";

export async function createBooking(formData: FormData) {
  const providerId = formData.get("provider_id") as string;
  const serviceTitle = formData.get("service_title") as string;
  const hours = parseFloat(formData.get("hours") as string);
  const hourlyRateCents = parseInt(
    formData.get("hourly_rate_cents") as string,
    10,
  );

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

  const { data: provider } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", providerId)
    .single();
  const { error: emailError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: "amalaikaladeesse@gmail.com", // TODO: replace with user.email once a verified domain is set up
    subject: "Booking request sent",
    html: `
      <h1>Your booking request has been sent</h1>
      <p>Service: <strong>${serviceTitle}</strong></p>
      <p>Provider: <strong>${provider?.full_name ?? "Provider"}</strong></p>
      <p>Amount: <strong>${(amountCents / 100).toFixed(2)} EUR</strong></p>
      <p>Status: Pending confirmation</p>
    `,
  });

  if (emailError) {
    console.error(
      "Failed to send booking confirmation email:",
      emailError.message,
    );
  }

  redirect(`/dashboard/bookings/${booking.id}`);
}

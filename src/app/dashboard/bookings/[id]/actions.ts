"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function createPaymentIntent(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, amount_cents, client_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  if (booking.client_id !== user.id) {
    throw new Error("Only the client can pay for this booking");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.amount_cents,
    currency: "eur",
    metadata: { bookingId: booking.id },
  });

  const { error: insertError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    stripe_payment_intent_id: paymentIntent.id,
    status: "processing",
    amount_cents: booking.amount_cents,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { clientSecret: paymentIntent.client_secret };
}

export async function getInvoiceUrl(bookingId: string) {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("pdf_storage_path")
    .eq("payment_id", payment.id)
    .single();

  if (!invoice) return null;

  const { data: signedUrl } = await supabase.storage
    .from("invoices")
    .createSignedUrl(invoice.pdf_storage_path, 60);

  return signedUrl?.signedUrl ?? null;
}
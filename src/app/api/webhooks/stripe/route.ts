import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { generateInvoicePdf } from "@/lib/invoice";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .select("id, booking_id, amount_cents")
      .single();

    if (updateError || !payment) {
      console.error("Failed to update payment status:", updateError?.message);
      return NextResponse.json({ received: true });
    }

   const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("service_title")
      .eq("id", payment.booking_id)
      .single();

    if (bookingError) {
      console.error("Failed to fetch booking for invoice:", bookingError.message);
    }
    
    const pdfBytes = await generateInvoicePdf({
      invoiceId: payment.id,
      serviceTitle: booking?.service_title ?? "Service",
      amountCents: payment.amount_cents,
      paidAt: new Date(),
    });

    const storagePath = `${payment.id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Failed to upload invoice:", uploadError.message);
      return NextResponse.json({ received: true });
    }

    const { error: invoiceError } = await supabase.from("invoices").insert({
      payment_id: payment.id,
      pdf_storage_path: storagePath,
    });

    if (invoiceError) {
      console.error("Failed to save invoice record:", invoiceError.message);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const { error } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Failed to update payment status:", error.message);
    }
  }

  return NextResponse.json({ received: true });
}
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

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
    const { error } = await supabase
      .from("payments")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Failed to update payment status:", error.message);
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
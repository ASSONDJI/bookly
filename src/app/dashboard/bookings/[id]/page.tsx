import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "@/components/chat-room";
import { CheckoutForm } from "@/components/checkout-form";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, service_title, status, client_id, provider_id")
    .eq("id", id)
    .single();

  if (!booking) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{booking.service_title}</h1>
        <p className="text-sm text-muted-foreground">{booking.status}</p>
      </div>

      <ChatRoom
        bookingId={booking.id}
        currentUserId={user.id}
        recipientId={
          user.id === booking.client_id ? booking.provider_id : booking.client_id
        }
      />

      <CheckoutForm bookingId={booking.id} />
    </div>
  );
}
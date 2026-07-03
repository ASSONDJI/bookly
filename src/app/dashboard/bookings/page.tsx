import { createClient } from "@/lib/supabase/server";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, service_title, status, scheduled_at, amount_cents, client_id, provider_id")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-destructive">Failed to load bookings.</p>;
  }

  if (!bookings || bookings.length === 0) {
    return <p className="text-muted-foreground">No bookings yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {bookings.map((booking) => (
        <div key={booking.id} className="rounded-md border border-border p-4">
          <p className="font-medium">{booking.service_title}</p>
          <p className="text-sm text-muted-foreground">
            {booking.status} · {(booking.amount_cents / 100).toFixed(2)} €
          </p>
        </div>
      ))}
    </div>
  );
}
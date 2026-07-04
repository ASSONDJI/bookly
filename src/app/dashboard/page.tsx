import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, service_title, status, amount_cents, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const activeCount =
    bookings?.filter((b) => b.status === "confirmed" || b.status === "pending")
      .length ?? 0;
  const completedCount =
    bookings?.filter((b) => b.status === "completed").length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.full_name || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.role === "provider"
            ? "Here's what's happening with your services."
            : "Here's what's happening with your bookings."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Active bookings</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        {profile?.role === "client" && (
          <Link
            href="/dashboard/providers"
            className="flex flex-col justify-center rounded-lg border border-primary/30 bg-primary/5 p-4 text-primary hover:bg-primary/10"
          >
            <p className="font-semibold">Find a provider →</p>
            <p className="text-sm text-primary/80">Book a new service</p>
          </Link>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent bookings</h2>
         <Link
            href="/dashboard/bookings"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            View all
          </Link>
        </div>

        {!bookings || bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-secondary"
              >
                <span className="font-medium">{booking.service_title}</span>
                <div className="flex items-center gap-3">
                  <StatusBadge status={booking.status} />
                  <span className="text-sm text-muted-foreground">
                    {(booking.amount_cents / 100).toFixed(2)} €
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
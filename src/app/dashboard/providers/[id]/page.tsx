import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "./actions";
import { Button } from "@/components/ui/button";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("profiles")
    .select("id, full_name, headline, bio, hourly_rate_cents")
    .eq("id", id)
    .eq("role", "provider")
    .single();

  if (!provider) {
    notFound();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{provider.full_name}</h1>
        <p className="text-muted-foreground">{provider.headline}</p>
      </div>

      {provider.bio && <p className="text-sm">{provider.bio}</p>}

      {provider.hourly_rate_cents && (
        <p className="font-medium">
          {(provider.hourly_rate_cents / 100).toFixed(2)} €/hour
        </p>
      )}

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 font-semibold">Book this provider</h2>
        <form action={createBooking} className="flex flex-col gap-4">
          <input type="hidden" name="provider_id" value={provider.id} />
          <input
            type="hidden"
            name="hourly_rate_cents"
            value={provider.hourly_rate_cents ?? 0}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="service_title" className="text-sm font-medium">
              What do you need done?
            </label>
            <input
              id="service_title"
              name="service_title"
              required
              placeholder="e.g. Weekly home cleaning"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="hours" className="text-sm font-medium">
              Estimated hours
            </label>
            <input
              id="hours"
              name="hours"
              type="number"
              min="0.5"
              step="0.5"
              defaultValue="1"
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit">Request booking</Button>
        </form>
      </div>
    </div>
  );
}
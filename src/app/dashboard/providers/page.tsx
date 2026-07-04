import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProvidersPage() {
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("profiles")
    .select("id, full_name, headline, hourly_rate_cents")
    .eq("role", "provider")
    .not("headline", "is", null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Find a provider</h1>
        <p className="text-sm text-muted-foreground">
          Browse available service providers and book directly.
        </p>
      </div>

      {!providers || providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No providers available yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((provider) => (
            <Link
              key={provider.id}
              href={`/dashboard/providers/${provider.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-secondary/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {provider.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <p className="font-medium">{provider.full_name}</p>
              <p className="text-sm text-muted-foreground">{provider.headline}</p>
              {provider.hourly_rate_cents && (
                <p className="text-sm font-medium">
                  {(provider.hourly_rate_cents / 100).toFixed(2)} €/hour
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
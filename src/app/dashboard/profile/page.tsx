import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, headline, bio, hourly_rate_cents")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Your profile</h1>

      <form action={updateProfile} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="full_name" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {profile?.role === "provider" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="headline" className="text-sm font-medium">
                Headline
              </label>
              <input
                id="headline"
                name="headline"
                defaultValue={profile?.headline ?? ""}
                placeholder="e.g. Professional house cleaner, 5 years experience"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={profile?.bio ?? ""}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="hourly_rate" className="text-sm font-medium">
                Hourly rate (EUR)
              </label>
              <input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                step="0.01"
                defaultValue={
                  profile?.hourly_rate_cents
                    ? (profile.hourly_rate_cents / 100).toFixed(2)
                    : ""
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
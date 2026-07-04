import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Account</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Email</span>
          <span>{user.email}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4">
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Sign out of your account on this device.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="destructive">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
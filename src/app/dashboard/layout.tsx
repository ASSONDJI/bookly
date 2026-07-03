import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border p-4">
        <p className="mb-6 text-lg font-bold">Bookly</p>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard">Home</Link>
          <Link href="/dashboard/bookings">Bookings</Link>
          <Link href="/dashboard/profile">Profile</Link>
          <Link href="/dashboard/settings">Settings</Link>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name ?? user.email} · {profile?.role}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
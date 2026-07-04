import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";

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
        <Link href="/dashboard" className="mb-6 flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="text-lg font-bold">Bookly</span>
        </Link>
        <DashboardNav />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name ?? user.email} · {profile?.role}
          </span>

          <NotificationBell userId={user.id} />
          
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
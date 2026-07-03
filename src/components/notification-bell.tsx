"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  payload: { bookingId?: string; preview?: string };
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((current) => [
            payload.new as Notification,
            ...current,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((current) =>
      current.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllAsRead();
        }}
        className="relative rounded-full p-2 hover:bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={
                  n.payload.bookingId
                    ? `/dashboard/bookings/${n.payload.bookingId}`
                    : "/dashboard"
                }
                onClick={() => setOpen(false)}
                className={cn(
                  "block border-b border-border p-3 text-sm last:border-0 hover:bg-secondary",
                  !n.read_at && "bg-primary/5"
                )}
              >
                <p className="font-medium">
                  {n.type === "new_message" ? "New message" : n.type}
                </p>
                {n.payload.preview && (
                  <p className="truncate text-muted-foreground">
                    {n.payload.preview}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
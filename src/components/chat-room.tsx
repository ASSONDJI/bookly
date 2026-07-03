"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  status: string;
  created_at: string;
};

const PAGE_SIZE = 20;

export function ChatRoom({
  bookingId,
  currentUserId,
}: {
  bookingId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    loadLatest();

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => {
            if (current.some((m) => m.id === incoming.id)) return current;
            return [...current, incoming];
          });
          if (incoming.sender_id !== currentUserId) {
            markAsRead(incoming.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((current) =>
            current.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadLatest() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      setMessages([...data].reverse());
      setHasMore(data.length === PAGE_SIZE);

      const unread = data.filter(
        (m) => m.sender_id !== currentUserId && m.status !== "read"
      );
      unread.forEach((m) => markAsRead(m.id));
    }
  }

  async function loadOlder() {
    if (messages.length === 0) return;
    setLoadingMore(true);

    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      setMessages((current) => [...[...data].reverse(), ...current]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }

  async function markAsRead(messageId: string) {
    await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("id", messageId);
  }

  async function sendMessage() {
    const text = content.trim();
    if (!text) return;

    setContent("");

    const optimisticId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: optimisticId,
      booking_id: bookingId,
      sender_id: currentUserId,
      content: text,
      status: "sent",
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    await supabase.from("messages").insert({
      id: optimisticId,
      booking_id: bookingId,
      sender_id: currentUserId,
      content: text,
    });
  }

  return (
    <div className="flex h-[500px] flex-col rounded-lg border border-border bg-card">
      <div className="flex-1 overflow-y-auto p-4">
        {hasMore && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={loadOlder}
              disabled={loadingMore}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    isOwn
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-secondary text-secondary-foreground"
                  )}
                >
                  <p>{message.content}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[10px]",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    <span>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && (
                      <span>{message.status === "read" ? "✓✓" : "✓"}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          Send
        </button>
      </div>
    </div>
  );
}
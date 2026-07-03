"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  status: string;
  created_at: string;
};

export function ChatRoom({
  bookingId,
  currentUserId,
}: {
  bookingId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

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
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase]);

  async function sendMessage() {
    if (!content.trim()) return;

    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content,
    });

    setContent("");
  }

  return (
    <div className="flex h-[500px] flex-col rounded-md border border-border">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender_id === currentUserId
                ? "mb-2 text-right"
                : "mb-2 text-left"
            }
          >
            <span className="inline-block rounded-md bg-secondary px-3 py-2 text-sm">
              {message.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Send
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getInvoiceUrl } from "@/app/dashboard/bookings/[id]/actions";

export function InvoiceDownloadButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const newTab = window.open("", "_blank");

    const url = await getInvoiceUrl(bookingId);
    setLoading(false);

    if (!url) {
      newTab?.close();
      setError("No invoice available yet.");
      return;
    }

    if (newTab) {
      newTab.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Preparing..." : "Download invoice"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
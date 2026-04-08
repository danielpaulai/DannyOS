"use client";

import { useState } from "react";

export function MarkReadButton({
  alertIds,
  label,
  small,
}: {
  alertIds: string[];
  label: string;
  small?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function markRead() {
    setLoading(true);
    try {
      await fetch("/api/alerts/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds }),
      });
      setDone(true);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (done) return null;

  return (
    <button
      onClick={markRead}
      disabled={loading}
      className={`text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 ${
        small ? "" : "px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

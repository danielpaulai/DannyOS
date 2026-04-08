"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function decide(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      await fetch("/api/approvals/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, status }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="text-xs text-muted-foreground">Decision recorded</span>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => decide("APPROVED")}
        disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        <Check className="h-3 w-3" /> Approve
      </button>
      <button
        onClick={() => decide("REJECTED")}
        disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        <X className="h-3 w-3" /> Reject
      </button>
    </div>
  );
}

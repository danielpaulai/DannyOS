"use client";

import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function decide(status: "APPROVED" | "REJECTED") {
    setLoading(status === "APPROVED" ? "approve" : "reject");
    try {
      await fetch("/api/approvals/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, status }),
      });
      setDone(status);
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
          done === "APPROVED" ? "text-emerald-600" : "text-[#e90d41]"
        }`}
        style={{ fontFamily: "'Rethink Sans', sans-serif" }}
      >
        {done === "APPROVED" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        {done === "APPROVED" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => decide("APPROVED")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0a0a0a] text-white text-xs font-semibold hover:bg-[#333333] transition-all disabled:opacity-50"
        style={{ fontFamily: "'Rethink Sans', sans-serif" }}
      >
        {loading === "approve" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Approve
      </button>
      <button
        onClick={() => decide("REJECTED")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-[#e90d41] text-[#e90d41] text-xs font-semibold hover:bg-[#fdf0f3] transition-all disabled:opacity-50"
        style={{ fontFamily: "'Rethink Sans', sans-serif" }}
      >
        {loading === "reject" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Reject
      </button>
    </div>
  );
}

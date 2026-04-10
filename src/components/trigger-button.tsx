"use client";

import { Play, Loader2 } from "lucide-react";
import { useState } from "react";

export function TriggerButton({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/agents/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={loading || done}
      title={done ? `${agentName} triggered` : `Trigger ${agentName}`}
      className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
        done
          ? "bg-emerald-50 text-emerald-600"
          : "hover:bg-accent/10 text-muted-foreground hover:text-accent"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

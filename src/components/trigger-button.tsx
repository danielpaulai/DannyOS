"use client";

import { Play } from "lucide-react";
import { useState } from "react";

export function TriggerButton({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/agents/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
    } finally {
      setLoading(false);
      window.location.reload();
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      title={`Trigger ${agentName}`}
      className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors disabled:opacity-50"
    >
      <Play className="h-3.5 w-3.5" />
    </button>
  );
}

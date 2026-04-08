import { db } from "@/lib/db";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await db.agentRun.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { name: true, slug: true } } },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Run History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete audit log of all agent executions
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Trigger</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Started</th>
                <th className="pb-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 font-medium">{run.agent.name}</td>
                  <td className="py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="py-3 text-muted-foreground">{run.trigger}</td>
                  <td className="py-3 text-muted-foreground font-mono text-xs">
                    {run.durationMs
                      ? `${(run.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {run.startedAt
                      ? format(run.startedAt, "MMM d, HH:mm")
                      : "—"}
                  </td>
                  <td className="py-3 text-xs text-red-600 max-w-xs truncate">
                    {run.error || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No runs recorded yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

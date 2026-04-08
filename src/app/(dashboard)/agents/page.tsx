import { db } from "@/lib/db";
import { parseAgentConfigForView } from "@/lib/agent-config";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { TriggerButton } from "@/components/trigger-button";
import { formatDistanceToNow } from "date-fns";
import { Bot, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await db.agent.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { runs: true, approvals: true } },
      runs: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true, durationMs: true },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All registered agents and their current status
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const lastRun = agent.runs[0];
          const cfg = parseAgentConfigForView(agent.config);
          return (
            <Card key={agent.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={agent.status} />
                  <TriggerButton agentId={agent.id} agentName={agent.name} />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                {agent.description}
              </p>

              {(cfg.inputs.length > 0 || cfg.outputs.length > 0) && (
                <div className="mt-3 space-y-2">
                  {cfg.inputs.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Inputs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cfg.inputs.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cfg.outputs.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Outputs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {cfg.outputs.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cfg.scheduleCron.length > 0 && (
                <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 font-mono">
                    {cfg.scheduleCron.map((cron) => (
                      <div key={cron}>{cron}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Runs</p>
                  <p className="text-sm font-medium">{agent._count.runs}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approvals</p>
                  <p className="text-sm font-medium">{agent._count.approvals}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Run</p>
                  <p className="text-sm font-medium">
                    {agent.lastRunAt
                      ? formatDistanceToNow(agent.lastRunAt, { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
              </div>

              {lastRun && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Last: <StatusBadge status={lastRun.status} />
                  </span>
                  {lastRun.durationMs && (
                    <span>{(lastRun.durationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {agents.length === 0 && (
        <Card className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            No agents registered. Run{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              npm run seed
            </code>{" "}
            to initialize.
          </p>
        </Card>
      )}
    </div>
  );
}

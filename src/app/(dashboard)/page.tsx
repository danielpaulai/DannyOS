import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Clock,
  BriefcaseBusiness,
  CalendarCheck2,
  Sparkles,
  Search,
} from "lucide-react";
import Link from "next/link";
import { TriggerButton } from "@/components/trigger-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [agents, recentRuns, pendingApprovals, recentAlerts, runStats, deals, meetings, briefs, researchBriefs] =
    await Promise.all([
      db.agent.findMany({ orderBy: { name: "asc" } }),
      db.agentRun.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { name: true, slug: true } } },
      }),
      db.approval.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { agent: { select: { name: true } } },
      }),
      db.alert.findMany({
        where: { read: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.agentRun.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.deal.findMany(),
      db.meeting.findMany({
        where: { status: { in: ["scheduled", "completed"] } },
      }),
      db.contentBrief.findMany(),
      db.researchBrief.findMany(),
    ]);

  const totalRuns = runStats.reduce((a, b) => a + b._count, 0);
  const completedRuns =
    runStats.find((r) => r.status === "COMPLETED")?._count ?? 0;
  const failedRuns = runStats.find((r) => r.status === "FAILED")?._count ?? 0;
  const activeAgents = agents.filter((a) => a.status === "RUNNING").length;
  const activeDeals = deals.filter((deal) => !["closed-won", "closed-lost"].includes(deal.stage));
  const pipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  const upcomingMeetings = meetings.filter((meeting) => meeting.status === "scheduled").length;
  const approvedBriefs = briefs.filter((brief) => brief.status === "approved").length;
  const completedResearch = researchBriefs.filter((brief) => brief.status === "completed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Executive operating system overview for sales, meetings, content, and research
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          sub={`${activeDeals.length} active deals`}
          trend="up"
        />
        <KpiCard
          label="Upcoming Meetings"
          value={upcomingMeetings}
          sub="Ghost + Scribe should be watching"
          trend="neutral"
        />
        <KpiCard
          label="Approved Briefs"
          value={approvedBriefs}
          sub="ready for Creator"
          trend="up"
        />
        <KpiCard
          label="Completed Research"
          value={completedResearch}
          sub={`${pendingApprovals.length} pending approvals`}
          trend="neutral"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader title="Business Lanes" />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Link href="/sales" className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
              <BriefcaseBusiness className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Sales</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Closer pipeline, stale deals, hot leads, approvals
              </p>
            </Link>
            <Link href="/meetings" className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
              <CalendarCheck2 className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Meetings</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Scribe intake, summaries, follow-ups, action items
              </p>
            </Link>
            <Link href="/content" className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
              <Sparkles className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Content</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Scout intelligence and Creator production pipeline
              </p>
            </Link>
            <Link href="/research" className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
              <Search className="h-5 w-5 text-accent" />
              <p className="mt-3 font-medium">Research</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ghost briefs and strategy intelligence
              </p>
            </Link>
          </div>
        </Card>

        {/* Agent Status Board */}
        <Card className="md:col-span-2">
          <CardHeader
            title="Agent Status"
            action={
              <Link
                href="/agents"
                className="text-xs text-accent hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {agent.lastRunAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(agent.lastRunAt, {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  <StatusBadge status={agent.status} />
                  <TriggerButton agentId={agent.id} agentName={agent.name} />
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No agents registered. Run the seed script to initialize.
              </p>
            )}
          </div>
        </Card>

        {/* Sidebar column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="System KPIs" />
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Total Runs</span>
                <span className="font-medium text-foreground">{totalRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed Runs</span>
                <span className="font-medium text-foreground">{completedRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Running Agents</span>
                <span className="font-medium text-foreground">{activeAgents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Failed Runs</span>
                <span className="font-medium text-foreground">{failedRuns}</span>
              </div>
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader
              title="Pending Approvals"
              action={
                <Link
                  href="/approvals"
                  className="text-xs text-accent hover:underline"
                >
                  View all
                </Link>
              }
            />
            <div className="space-y-3">
              {pendingApprovals.map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.agent.name} &middot; {a.type}
                    </p>
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No pending approvals
                </p>
              )}
            </div>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader title="Unread Alerts" />
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      alert.severity === "urgent"
                        ? "text-red-500"
                        : alert.severity === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(alert.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  All clear
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader
          title="Recent Runs"
          action={
            <Link
              href="/runs"
              className="text-xs text-accent hover:underline"
            >
              View all
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Trigger</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2.5 font-medium">{run.agent.name}</td>
                  <td className="py-2.5">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {run.trigger}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {run.startedAt
                      ? formatDistanceToNow(run.startedAt, { addSuffix: true })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentRuns.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No runs yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

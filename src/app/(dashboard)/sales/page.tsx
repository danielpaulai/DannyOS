import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNowStrict } from "date-fns";
import { Flame, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const now = new Date();
  const [deals, pendingApprovals, meetings] = await Promise.all([
    db.deal.findMany({
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      include: {
        contact: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
    }),
    db.approval.findMany({
      where: { status: "PENDING", agent: { slug: "closer" } },
      include: { agent: { select: { name: true } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    db.meeting.findMany({
      where: { status: "completed" },
      include: { contact: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
  ]);

  const activeDeals = deals.filter(
    (deal) => !["closed-won", "closed-lost"].includes(deal.stage),
  );
  const totalPipelineValue = activeDeals.reduce(
    (sum, deal) => sum + (deal.value ?? 0),
    0,
  );
  const hotLeads = activeDeals.filter((deal) => (deal.score ?? 0) >= 75);
  const staleDeals = activeDeals.filter((deal) => {
    const ageHours = (now.getTime() - deal.updatedAt.getTime()) / (1000 * 60 * 60);
    return ageHours >= 72;
  });
  const stageSummary = activeDeals.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Control Room</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pipeline health, hot leads, stale deals, and Closer approvals
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active Deals"
          value={activeDeals.length}
          sub={`${deals.length} total tracked`}
          trend="neutral"
        />
        <KpiCard
          label="Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          sub={`${hotLeads.length} hot leads`}
          trend="up"
        />
        <KpiCard
          label="Stale Deals"
          value={staleDeals.length}
          sub="72h+ without fresh activity"
          trend={staleDeals.length > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Pending Actions"
          value={pendingApprovals.length}
          sub="follow-ups or stage changes"
          trend={pendingApprovals.length > 0 ? "down" : "neutral"}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Pipeline Board" />
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(stageSummary).map(([stage, count]) => (
              <div key={stage} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stage.replaceAll("-", " ")}
                </p>
                <p className="mt-2 text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Deal</th>
                  <th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {activeDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.company?.name ?? deal.contact?.name ?? "Unassigned"}
                      </p>
                    </td>
                    <td className="py-3 text-muted-foreground capitalize">
                      {deal.stage.replaceAll("-", " ")}
                    </td>
                    <td className="py-3">
                      <StatusBadge
                        status={
                          (deal.score ?? 0) >= 75
                            ? "HOT"
                            : (deal.score ?? 0) >= 50
                              ? "WARM"
                              : "COLD"
                        }
                      />
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {deal.value ? `$${deal.value.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {deal.nextAction ?? "No action logged"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Hot Leads" />
            <div className="space-y-3">
              {hotLeads.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-start gap-3">
                  <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Score {deal.score ?? 0} · {deal.nextAction ?? "Review next move"}
                    </p>
                  </div>
                </div>
              ))}
              {hotLeads.length === 0 && (
                <p className="text-sm text-muted-foreground">No hot leads yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Closer Approval Queue" />
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{approval.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {approval.description}
                  </p>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending sales approvals.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Sales Meetings" />
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.contact?.name ?? "Unknown contact"} ·{" "}
                      {formatDistanceToNowStrict(meeting.scheduledAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent meetings.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

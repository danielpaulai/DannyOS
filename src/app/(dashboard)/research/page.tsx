import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { formatDistanceToNowStrict } from "date-fns";
import { Search, Building2, Radar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const briefs = await db.researchBrief.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const completed = briefs.filter((brief) => brief.status === "completed");
  const pending = briefs.filter((brief) => brief.status !== "completed");
  const byType = briefs.reduce<Record<string, number>>((acc, brief) => {
    acc[brief.type] = (acc[brief.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Research Desk</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prospect briefs, market scans, and competitor intelligence from Ghost
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Completed" value={completed.length} sub="ready to use" trend="up" />
        <KpiCard label="Pending" value={pending.length} sub="queued or in progress" trend={pending.length > 0 ? "neutral" : "up"} />
        <KpiCard label="Companies" value={byType.company ?? 0} sub="company-level briefs" trend="neutral" />
        <KpiCard label="Competitors" value={byType.competitor ?? 0} sub="competitive monitoring" trend="neutral" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Research Queue" />
          <div className="space-y-4">
            {briefs.map((brief) => (
              <div key={brief.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{brief.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {brief.type} · requested by {brief.requestedBy ?? "manual"}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {brief.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {brief.context ?? "No context captured."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNowStrict(brief.updatedAt, { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Research Types" />
            <div className="space-y-3">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="flex items-start gap-3">
                  <Search className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize">{type}</p>
                    <p className="text-xs text-muted-foreground">{count} briefs</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recommended Uses" />
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Trigger Ghost before discovery calls and strategy sessions.</p>
              </div>
              <div className="flex items-start gap-3">
                <Radar className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Use Scout for ongoing competitive signals and Ghost for deeper strategic prep.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

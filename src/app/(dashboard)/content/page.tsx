import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { Sparkles, Clapperboard, PenSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [briefs, scripts] = await Promise.all([
    db.contentBrief.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { scripts: { orderBy: { updatedAt: "desc" } } },
    }),
    db.script.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { brief: { select: { title: true, platform: true } } },
    }),
  ]);

  const ideaCount = briefs.filter((brief) => brief.status === "idea").length;
  const approvedCount = briefs.filter((brief) => brief.status === "approved").length;
  const publishedCount = briefs.filter((brief) => brief.status === "published").length;
  const draftScripts = scripts.filter((script) => script.status === "draft").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scout opportunities, Creator briefs, and script production pipeline
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Ideas" value={ideaCount} sub="waiting prioritization" trend="neutral" />
        <KpiCard label="Approved Briefs" value={approvedCount} sub="ready for Creator" trend="up" />
        <KpiCard label="Draft Scripts" value={draftScripts} sub="awaiting review" trend="neutral" />
        <KpiCard label="Published" value={publishedCount} sub="closed content loop" trend="up" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Content Brief Pipeline" />
          <div className="space-y-4">
            {briefs.map((brief) => (
              <div key={brief.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{brief.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {brief.platform} · {brief.source ?? "manual"} · {brief.topic}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {brief.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {brief.angle ?? "No angle recorded yet."}
                </p>
                {brief.hook && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Hook
                    </span>
                    <p className="mt-1">{brief.hook}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Creator Drafts" />
            <div className="space-y-3">
              {scripts.slice(0, 6).map((script) => (
                <div key={script.id} className="flex items-start gap-3">
                  <PenSquare className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{script.brief.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {script.brief.platform} · {script.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Scout to Creator Loop" />
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Scout finds winning hooks and gaps in your market.</p>
              </div>
              <div className="flex items-start gap-3">
                <Clapperboard className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Creator turns approved angles into scripts, hook banks, and batch packs.</p>
              </div>
              <p className="text-xs">
                This page should become your content factory queue: idea, brief, script, review,
                record, publish.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

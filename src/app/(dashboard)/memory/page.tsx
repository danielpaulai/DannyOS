import { db } from "@/lib/db";
import { Card, CardHeader, KpiCard } from "@/components/card";
import { Brain, FileSearch, Quote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const [chunks, recentRuns, transcripts] = await Promise.all([
    db.knowledgeChunk.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.agentRun.findMany({
      where: { agent: { slug: "echo" } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.transcript.count(),
  ]);

  const avgConfidence =
    chunks.length > 0
      ? chunks.reduce((sum, chunk) => sum + chunk.confidence, 0) / chunks.length
      : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Memory Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Echo calibration, source coverage, and semantic knowledge readiness
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Knowledge Chunks" value={chunks.length} sub="recent indexed records" trend="up" />
        <KpiCard label="Transcripts" value={transcripts} sub="raw source material" trend="up" />
        <KpiCard label="Avg Confidence" value={`${Math.round(avgConfidence * 100)}%`} sub="recent chunk confidence" trend="neutral" />
        <KpiCard label="Echo Runs" value={recentRuns.length} sub="recent Q&A attempts" trend="neutral" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Knowledge Chunks" />
          <div className="space-y-4">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium capitalize">{chunk.source}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tags: {chunk.tags.length > 0 ? chunk.tags.join(", ") : "none"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(chunk.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Echo Readiness" />
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Brain className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Echo should answer from real source material, not improvise Daniel’s opinions.</p>
              </div>
              <div className="flex items-start gap-3">
                <FileSearch className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>Every response should show sources and a confidence signal in the UI.</p>
              </div>
              <div className="flex items-start gap-3">
                <Quote className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p>If confidence is low, Echo should explicitly say it does not know.</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Echo Activity" />
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{run.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trigger: {run.trigger}
                  </p>
                </div>
              ))}
              {recentRuns.length === 0 && (
                <p className="text-sm text-muted-foreground">No Echo runs recorded yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import { generateSlackDigest } from "@/lib/services/slack";

export const dynamic = "force-dynamic";

// GET /api/pulse/digest — run Pulse manually and return the Slack digest
export async function GET() {
  try {
    const digest = await generateSlackDigest(4);

    // Store an alert for any blockers found
    const pulse = await db.agent.findUnique({ where: { slug: "pulse" } });
    if (pulse && digest.blockers.length > 0) {
      await db.alert.create({
        data: {
          agentId: pulse.id,
          channel: "dashboard",
          severity: "warning",
          title: `Pulse: ${digest.blockers.length} blocker(s) detected`,
          message: digest.blockers
            .map((b) => `#${b.channelName}: ${b.text.slice(0, 100)}`)
            .join("\n"),
        },
      });
    }

    // Log the run
    if (pulse) {
      await db.agentRun.create({
        data: {
          agentId: pulse.id,
          status: "COMPLETED",
          trigger: "manual-api",
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 0,
          output: {
            totalMessages: digest.totalMessages,
            channels: digest.channelSummaries.length,
            blockers: digest.blockers.length,
            decisions: digest.decisions.length,
            mentions: digest.mentions.length,
          },
        },
      });

      await db.agent.update({
        where: { id: pulse.id },
        data: { lastRunAt: new Date(), status: "IDLE" },
      });
    }

    return Response.json({ ok: true, digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

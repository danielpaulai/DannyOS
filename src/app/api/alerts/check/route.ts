import { db } from "@/lib/db";
import { sendTelegramAlert } from "@/lib/telegram";
import { sendTelegramApprovalRequest } from "@/lib/telegram";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/alerts/check — scan for conditions that need attention and send alerts
// Run this on a cron (every 30 min) or call manually
export async function GET() {
  const now = new Date();
  const alerts: { title: string; message: string; severity: "info" | "warning" | "urgent" }[] = [];

  // 1. Stale deals (no update in 72h+)
  const staleDeals = await db.deal.findMany({
    where: {
      stage: { notIn: ["closed-won", "closed-lost"] },
      updatedAt: { lt: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
    },
    include: { company: { select: { name: true } } },
  });

  if (staleDeals.length > 0) {
    alerts.push({
      title: `${staleDeals.length} stale deal(s)`,
      message: staleDeals
        .map(
          (d) =>
            `${d.title} (${d.company?.name ?? "no company"}) — last updated ${formatDistanceToNow(d.updatedAt, { addSuffix: true })}`
        )
        .join("\n"),
      severity: "warning",
    });
  }

  // 2. Aging approvals (pending 4h+)
  const agingApprovals = await db.approval.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
    },
    include: { agent: { select: { name: true } } },
  });

  if (agingApprovals.length > 0) {
    alerts.push({
      title: `${agingApprovals.length} approval(s) aging`,
      message: agingApprovals
        .map(
          (a) =>
            `${a.title} (${a.agent.name}) — waiting ${formatDistanceToNow(a.createdAt, { addSuffix: true })}`
        )
        .join("\n"),
      severity: "urgent",
    });

    // Send each as a Telegram approval request
    for (const a of agingApprovals) {
      await sendTelegramApprovalRequest({
        approvalId: a.id,
        title: a.title,
        description: a.description,
        agentName: a.agent.name,
      });
    }
  }

  // 3. Failed agent runs in last 6h
  const failedRuns = await db.agentRun.findMany({
    where: {
      status: "FAILED",
      createdAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
    },
    include: { agent: { select: { name: true } } },
  });

  if (failedRuns.length > 0) {
    alerts.push({
      title: `${failedRuns.length} agent run(s) failed`,
      message: failedRuns
        .map((r) => `${r.agent.name}: ${r.error?.slice(0, 100) ?? "unknown error"}`)
        .join("\n"),
      severity: "urgent",
    });
  }

  // 4. Agents stuck in ERROR state
  const errorAgents = await db.agent.findMany({
    where: { status: "ERROR" },
  });

  if (errorAgents.length > 0) {
    alerts.push({
      title: `${errorAgents.length} agent(s) in ERROR state`,
      message: errorAgents.map((a) => a.name).join(", "),
      severity: "urgent",
    });
  }

  // 5. Meetings today without transcripts from yesterday's meetings
  const yesterdayMeetings = await db.meeting.findMany({
    where: {
      status: "completed",
      scheduledAt: {
        gte: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        lt: now,
      },
    },
    include: { transcript: true, contact: { select: { name: true } } },
  });

  const noTranscript = yesterdayMeetings.filter((m) => !m.transcript);
  if (noTranscript.length > 0) {
    alerts.push({
      title: `${noTranscript.length} recent meeting(s) without transcripts`,
      message: noTranscript
        .map((m) => `${m.title} with ${m.contact?.name ?? "unknown"}`)
        .join("\n"),
      severity: "info",
    });
  }

  // Store alerts in DB and send to Telegram
  const chiefOfStaff = await db.agent.findUnique({
    where: { slug: "chief-of-staff" },
  });

  for (const alert of alerts) {
    // Check if we already sent this alert recently (dedup by title in last 6h)
    const existing = await db.alert.findFirst({
      where: {
        title: alert.title,
        createdAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await db.alert.create({
        data: {
          agentId: chiefOfStaff?.id,
          channel: "telegram",
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
        },
      });

      await sendTelegramAlert(alert);
    }
  }

  return Response.json({
    ok: true,
    alertsGenerated: alerts.length,
    alerts: alerts.map((a) => ({ title: a.title, severity: a.severity })),
  });
}

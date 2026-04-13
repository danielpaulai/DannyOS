import { db } from "@/lib/db";
import { complete } from "@/lib/services/ai";
import { AGENT_PROMPTS } from "@/lib/services/ai";
import { sendTelegramAlert } from "@/lib/telegram";
import { formatDistanceToNow, isToday, isTomorrow, format } from "date-fns";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// GET /api/briefing — generate and optionally deliver the morning briefing
// ?deliver=telegram to also send it
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deliver = url.searchParams.get("deliver");
  const type = url.searchParams.get("type") ?? "morning"; // morning | evening

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000);

    // Gather all business context
    const [
      pendingApprovals,
      upcomingMeetings,
      activeDeals,
      staleDeals,
      unreadAlerts,
      recentRuns,
      failedRuns,
      contentBriefs,
      agentStatuses,
      researchBriefs,
    ] = await Promise.all([
      db.approval.findMany({
        where: { status: "PENDING" },
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.meeting.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: tomorrowEnd },
          status: "scheduled",
        },
        include: { contact: { select: { name: true, email: true } } },
        orderBy: { scheduledAt: "asc" },
      }),
      db.deal.findMany({
        where: { stage: { notIn: ["closed-won", "closed-lost"] } },
        include: {
          contact: { select: { name: true } },
          company: { select: { name: true } },
        },
        orderBy: { score: "desc" },
      }),
      db.deal.findMany({
        where: {
          stage: { notIn: ["closed-won", "closed-lost"] },
          updatedAt: { lt: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
        },
        include: { company: { select: { name: true } } },
      }),
      db.alert.findMany({
        where: { read: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.agentRun.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.agentRun.findMany({
        where: {
          status: "FAILED",
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        include: { agent: { select: { name: true } } },
      }),
      db.contentBrief.findMany({
        where: { status: { in: ["idea", "approved"] } },
      }),
      db.agent.findMany({
        select: { name: true, slug: true, status: true, lastRunAt: true },
      }),
      db.researchBrief.findMany({
        where: { status: "pending" },
      }),
    ]);

    // Check which meetings have Ghost research prepared
    const meetingsWithoutPrep = upcomingMeetings.filter((m) => {
      // Simple check — in production you'd link meetings to research briefs
      return true; // Flag all for now
    });

    // Build the context for Claude
    const pipelineValue = activeDeals.reduce((s, d) => s + (d.value ?? 0), 0);
    const hotDeals = activeDeals.filter((d) => (d.score ?? 0) >= 75);

    const context = {
      type,
      date: format(now, "EEEE, MMMM d, yyyy"),
      time: format(now, "h:mm a"),

      // Approvals
      pendingApprovals: pendingApprovals.map((a) => ({
        title: a.title,
        agent: a.agent.name,
        type: a.type,
        age: formatDistanceToNow(a.createdAt, { addSuffix: true }),
      })),

      // Meetings
      todayMeetings: upcomingMeetings
        .filter((m) => isToday(m.scheduledAt))
        .map((m) => ({
          title: m.title,
          time: format(m.scheduledAt, "h:mm a"),
          contact: m.contact?.name ?? "Unknown",
          hasPrep: false,
        })),
      tomorrowMeetings: upcomingMeetings
        .filter((m) => isTomorrow(m.scheduledAt))
        .map((m) => ({
          title: m.title,
          time: format(m.scheduledAt, "h:mm a"),
          contact: m.contact?.name ?? "Unknown",
        })),

      // Sales
      pipelineValue,
      activeDeals: activeDeals.length,
      hotDeals: hotDeals.map((d) => ({
        title: d.title,
        score: d.score,
        nextAction: d.nextAction,
      })),
      staleDeals: staleDeals.map((d) => ({
        title: d.title,
        company: d.company?.name,
        lastUpdate: formatDistanceToNow(d.updatedAt, { addSuffix: true }),
      })),

      // Alerts
      unreadAlerts: unreadAlerts.map((a) => ({
        title: a.title,
        severity: a.severity,
      })),

      // Agent health
      failedRuns: failedRuns.map((r) => ({
        agent: r.agent.name,
        error: r.error?.slice(0, 100),
      })),
      agentsInError: agentStatuses
        .filter((a) => a.status === "ERROR")
        .map((a) => a.name),
      recentRunCount: recentRuns.length,

      // Content
      contentIdeas: contentBriefs.filter((b) => b.status === "idea").length,
      approvedBriefs: contentBriefs.filter((b) => b.status === "approved").length,

      // Research
      pendingResearch: researchBriefs.length,
    };

    // Generate the briefing
    const briefing = await complete({
      system: `${AGENT_PROMPTS["chief-of-staff"].system}

Format rules:
- Lead with the single most important thing Daniel needs to act on
- Use bullet points, not paragraphs
- Group into: URGENT, TODAY, PIPELINE, CONTENT, SYSTEM
- Skip any section that has nothing notable
- Keep it under 300 words
- Be specific with names, numbers, and deadlines
- If there are pending approvals, say exactly how many and from which agents
- If there are stale deals, name them
- End with one "Bottom line" sentence`,
      prompt: `Generate Daniel's ${type} briefing for ${context.date}.\n\nContext:\n${JSON.stringify(context, null, 2)}`,
      maxTokens: 1500,
      temperature: 0.2,
    });

    // Log the run
    const chiefOfStaff = await db.agent.findUnique({
      where: { slug: "chief-of-staff" },
    });
    if (chiefOfStaff) {
      await db.agentRun.create({
        data: {
          agentId: chiefOfStaff.id,
          status: "COMPLETED",
          trigger: "api",
          startedAt: now,
          completedAt: new Date(),
          durationMs: Date.now() - now.getTime(),
          output: { type, delivered: deliver ?? "none" },
          markdown: briefing,
        },
      });
      await db.agent.update({
        where: { id: chiefOfStaff.id },
        data: { lastRunAt: new Date(), status: "IDLE" },
      });
    }

    // Deliver via Telegram if requested
    if (deliver === "telegram") {
      const emoji = type === "morning" ? "☀️" : "🌙";
      await sendTelegramAlert({
        title: `${emoji} ${type === "morning" ? "Morning" : "Evening"} Briefing`,
        message: briefing,
        severity: "info",
      });
    }

    return Response.json({
      ok: true,
      type,
      date: context.date,
      briefing,
      stats: {
        pendingApprovals: pendingApprovals.length,
        todayMeetings: context.todayMeetings.length,
        activeDeals: activeDeals.length,
        staleDeals: staleDeals.length,
        hotDeals: hotDeals.length,
        failedRuns: failedRuns.length,
        unreadAlerts: unreadAlerts.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

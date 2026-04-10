import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "./db";
import { sendTelegramAlert } from "./telegram";
import { generateSlackDigest } from "./services/slack";
import { summarizeTranscript, scoreDeal, generateScript, generateBriefing, answerFromKnowledge, generateResearchBrief } from "./services/ai";
import { scanCompetitors } from "./services/apify";
import { researchCompany, researchPerson, researchMarket } from "./services/brave";
import type { Prisma } from "@/generated/prisma/client";

// Helper to cast plain objects to Prisma JSON type
function jsonValue(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

// Redis connection — shared across queue and workers
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// ─── Queues ─────────────────────────────────────────────────────────

export const agentQueue = new Queue("agent-runs", { connection });
export const notificationQueue = new Queue("notifications", { connection });

// ─── Job Interfaces ─────────────────────────────────────────────────

interface AgentJobData {
  runId: string;
  agentId: string;
  agentSlug: string;
  trigger: string;
  input: Record<string, unknown>;
}

interface NotificationJobData {
  channel: "telegram" | "slack";
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
}

// ─── Agent Worker ───────────────────────────────────────────────────

export function startAgentWorker() {
  const worker = new Worker<AgentJobData>(
    "agent-runs",
    async (job: Job<AgentJobData>) => {
      const { runId, agentId, agentSlug, input } = job.data;

      // Mark run as running
      await db.agentRun.update({
        where: { id: runId },
        data: { status: "RUNNING", startedAt: new Date() },
      });

      await db.agent.update({
        where: { id: agentId },
        data: { status: "RUNNING" },
      });

      const startTime = Date.now();

      try {
        // Agent execution would go here — dispatch to the specific agent module
        // For now, return a placeholder result
        const result = await executeAgent(agentSlug, input);

        const durationMs = Date.now() - startTime;

        // Check if result needs approval
        if (result.needsApproval) {
          await db.approval.create({
            data: {
              agentId,
              runId,
              type: result.approvalType ?? "action",
              title: result.approvalTitle ?? `${agentSlug} action requires approval`,
              description: result.approvalDescription ?? "",
              payload: jsonValue(result.output ?? {}),
            },
          });

          await db.agentRun.update({
            where: { id: runId },
            data: { status: "WAITING_APPROVAL", durationMs },
          });
        } else {
          await db.agentRun.update({
            where: { id: runId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              durationMs,
              output: jsonValue(result.output ?? {}),
              markdown: result.markdown,
            },
          });
        }

        await db.agent.update({
          where: { id: agentId },
          data: { status: "IDLE", lastRunAt: new Date() },
        });

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        await db.agentRun.update({
          where: { id: runId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            durationMs,
            error: errorMessage,
          },
        });

        await db.agent.update({
          where: { id: agentId },
          data: { status: "ERROR" },
        });

        // Create alert for failures
        await db.alert.create({
          data: {
            agentId,
            channel: "dashboard",
            severity: "urgent",
            title: `${agentSlug} run failed`,
            message: errorMessage,
          },
        });

        // Notify via Telegram
        await notificationQueue.add("failure-alert", {
          channel: "telegram",
          title: `Agent Failed: ${agentSlug}`,
          message: errorMessage,
          severity: "urgent",
        });

        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[AgentWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ─── Notification Worker ────────────────────────────────────────────

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    async (job: Job<NotificationJobData>) => {
      const { channel, title, message, severity } = job.data;

      if (channel === "telegram") {
        await sendTelegramAlert({ title, message, severity });
      }
      // Slack notifications would go here
    },
    { connection, concurrency: 5 }
  );

  return worker;
}

// ─── Agent Result Type ──────────────────────────────────────────────

type AgentResult = {
  output?: Record<string, unknown>;
  markdown?: string;
  needsApproval?: boolean;
  approvalType?: string;
  approvalTitle?: string;
  approvalDescription?: string;
};

// ─── Agent Execution Dispatcher ─────────────────────────────────────

async function executeAgent(
  slug: string,
  _input: Record<string, unknown>
): Promise<AgentResult> {
  switch (slug) {
    case "chief-of-staff":
      return executeChiefOfStaff();
    case "pulse":
      return executePulse();
    case "scribe":
      return executeScribe(_input);
    case "closer":
      return executeCloser();
    case "scout":
      return executeScout();
    case "creator":
      return executeCreator(_input);
    case "ghost":
      return executeGhost(_input);
    case "echo":
      return executeEcho(_input);
    default:
      return { output: { status: "unknown agent" } };
  }
}

// ─── Chief of Staff ─────────────────────────────────────────────────

async function executeChiefOfStaff(): Promise<AgentResult> {
  const [approvals, meetings, deals, alerts, briefs, agents] = await Promise.all([
    db.approval.count({ where: { status: "PENDING" } }),
    db.meeting.findMany({ where: { status: "scheduled" }, select: { title: true } }),
    db.deal.findMany({
      where: { stage: { notIn: ["closed-won", "closed-lost"] } },
      select: { title: true, stage: true, score: true },
    }),
    db.alert.findMany({ where: { read: false }, select: { title: true }, take: 5 }),
    db.contentBrief.groupBy({ by: ["status"], _count: true }),
    db.agent.findMany({ select: { name: true, status: true, lastRunAt: true } }),
  ]);

  const pipeline = {
    ideas: briefs.find((b) => b.status === "idea")?._count ?? 0,
    approved: briefs.find((b) => b.status === "approved")?._count ?? 0,
    drafts: briefs.find((b) => b.status === "scripted")?._count ?? 0,
  };

  const briefing = await generateBriefing({
    pendingApprovals: approvals,
    todayMeetings: meetings.map((m) => m.title),
    activeDeals: deals.map((d) => ({ title: d.title, stage: d.stage, score: d.score })),
    recentAlerts: alerts.map((a) => a.title),
    contentPipeline: pipeline,
    agentStatus: agents.map((a) => ({
      name: a.name,
      status: a.status,
      lastRun: a.lastRunAt?.toISOString() ?? null,
    })),
  });

  return {
    output: { briefing: "generated", deals: deals.length, approvals },
    markdown: briefing,
  };
}

// ─── Scribe ─────────────────────────────────────────────────────────

async function executeScribe(input: Record<string, unknown>): Promise<AgentResult> {
  const transcriptId = input.transcriptId as string | undefined;
  if (!transcriptId) return { output: { error: "No transcriptId provided" } };

  const transcript = await db.transcript.findUnique({
    where: { id: transcriptId },
    include: { meeting: true },
  });
  if (!transcript) return { output: { error: "Transcript not found" } };

  const result = await summarizeTranscript(transcript.rawText);

  // Update the transcript record
  await db.transcript.update({
    where: { id: transcriptId },
    data: {
      summary: result.summary,
      actionItems: result.actionItems as unknown as Prisma.InputJsonValue,
      sentiment: result.sentiment,
    },
  });

  return {
    output: {
      summary: result.summary,
      actionItems: result.actionItems.length,
      decisions: result.decisions.length,
    },
    markdown: `## Meeting Summary: ${transcript.meeting?.title ?? "Unknown"}\n\n${result.summary}\n\n### Decisions\n${result.decisions.map((d) => `- ${d}`).join("\n")}\n\n### Action Items\n${result.actionItems.map((a) => `- ${a.item} (${a.owner})`).join("\n")}`,
    needsApproval: true,
    approvalType: "follow-up-draft",
    approvalTitle: `Review follow-up: ${transcript.meeting?.title ?? "Meeting"}`,
    approvalDescription: `Subject: ${result.followUpDraft.subject}\n\n${result.followUpDraft.body.slice(0, 200)}...`,
  };
}

// ─── Closer ─────────────────────────────────────────────────────────

async function executeCloser(): Promise<AgentResult> {
  const deals = await db.deal.findMany({
    where: { stage: { notIn: ["closed-won", "closed-lost"] } },
    include: { contact: { select: { name: true } }, company: { select: { name: true } } },
  });

  const scoredDeals: { title: string; score: number; nextAction: string }[] = [];
  let needsApproval = false;

  for (const deal of deals) {
    const result = await scoreDeal({
      title: deal.title,
      stage: deal.stage,
      value: deal.value,
      lastActivity: deal.updatedAt.toISOString(),
      contactName: deal.contact?.name ?? "Unknown",
      notes: deal.nextAction ?? "",
    });

    await db.deal.update({
      where: { id: deal.id },
      data: { score: result.score, nextAction: result.nextAction },
    });

    scoredDeals.push({ title: deal.title, score: result.score, nextAction: result.nextAction });

    if (result.followUpDraft || result.stageRecommendation) {
      needsApproval = true;
    }
  }

  return {
    output: { dealsScored: scoredDeals.length, scores: scoredDeals },
    markdown: `## Deal Scores\n\n${scoredDeals.map((d) => `- **${d.title}**: ${d.score}/100 — ${d.nextAction}`).join("\n")}`,
    needsApproval,
    approvalType: needsApproval ? "stage-change" : undefined,
    approvalTitle: needsApproval ? `Closer: ${scoredDeals.length} deals scored, actions pending` : undefined,
    approvalDescription: needsApproval ? "Closer has follow-ups or stage changes to review." : undefined,
  };
}

// ─── Scout ──────────────────────────────────────────────────────────

async function executeScout(): Promise<AgentResult> {
  if (!process.env.APIFY_API_TOKEN) {
    return { output: { error: "APIFY_API_TOKEN not set — skipping competitor scan" } };
  }

  // TODO: Load competitors from a config or DB table
  const competitors = [
    { name: "Competitor 1", instagram: "example_handle" },
  ];

  const results = await scanCompetitors(competitors);

  return {
    output: {
      competitorsScanned: results.length,
      totalPosts: results.reduce((s, r) => s + r.totalPosts, 0),
    },
    markdown: results
      .map(
        (r) =>
          `### ${r.competitor}\n- Posts: ${r.totalPosts}\n- Avg engagement: ${Math.round(r.avgEngagement)}\n- Top post: ${r.topPost?.text.slice(0, 100) ?? "N/A"}`
      )
      .join("\n\n"),
  };
}

// ─── Creator ────────────────────────────────────────────────────────

async function executeCreator(input: Record<string, unknown>): Promise<AgentResult> {
  const briefId = input.briefId as string | undefined;

  const briefs = briefId
    ? await db.contentBrief.findMany({ where: { id: briefId } })
    : await db.contentBrief.findMany({ where: { status: "approved" }, take: 3 });

  if (briefs.length === 0) return { output: { error: "No approved briefs to process" } };

  const scripts: { title: string; hook: string }[] = [];

  for (const brief of briefs) {
    const result = await generateScript({
      title: brief.title,
      topic: brief.topic,
      platform: brief.platform,
      angle: brief.angle,
      hook: brief.hook,
    });

    await db.script.create({
      data: {
        briefId: brief.id,
        body: `Hook: ${result.hooks[0]}\n\n${result.script}\n\nCTA: ${result.cta}`,
        format: result.format,
        status: "draft",
      },
    });

    scripts.push({ title: brief.title, hook: result.hooks[0] });
  }

  return {
    output: { scriptsGenerated: scripts.length },
    needsApproval: true,
    approvalType: "script",
    approvalTitle: `Creator: ${scripts.length} script(s) ready for review`,
    approvalDescription: scripts.map((s) => `${s.title}: "${s.hook}"`).join("\n"),
  };
}

// ─── Ghost ──────────────────────────────────────────────────────────

async function executeGhost(input: Record<string, unknown>): Promise<AgentResult> {
  const subject = (input.subject as string) ?? "";
  const type = (input.type as string) ?? "company";
  const context = (input.context as string) ?? "";

  if (!process.env.BRAVE_API_KEY) {
    // Fallback: generate brief from AI without search
    const result = await generateResearchBrief({ subject, type, context });
    return { output: result as unknown as Record<string, unknown> };
  }

  // Fetch search results based on type
  let searchData: string;
  if (type === "person") {
    const r = await researchPerson(subject);
    searchData = JSON.stringify(r);
  } else if (type === "market") {
    const r = await researchMarket(subject);
    searchData = JSON.stringify(r);
  } else {
    const r = await researchCompany(subject);
    searchData = JSON.stringify(r);
  }

  const result = await generateResearchBrief({ subject, type, context, searchResults: searchData });

  // Save to DB
  await db.researchBrief.create({
    data: {
      subject,
      type,
      requestedBy: "ghost",
      context,
      findings: result as unknown as Prisma.InputJsonValue,
      sources: result.sources as unknown as Prisma.InputJsonValue,
      status: "completed",
    },
  });

  return {
    output: { subject, type, keyFacts: result.keyFacts.length, sources: result.sources.length },
    markdown: `## Research Brief: ${subject}\n\n${result.overview}\n\n### Key Facts\n${result.keyFacts.map((f) => `- ${f}`).join("\n")}\n\n### Talking Points\n${result.talkingPoints.map((t) => `- ${t}`).join("\n")}`,
  };
}

// ─── Echo ───────────────────────────────────────────────────────────

async function executeEcho(input: Record<string, unknown>): Promise<AgentResult> {
  const question = (input.question as string) ?? "";
  if (!question) return { output: { error: "No question provided" } };

  // Retrieve knowledge chunks (simple text match for now, embeddings later)
  const chunks = await db.knowledgeChunk.findMany({
    take: 10,
    orderBy: { confidence: "desc" },
  });

  if (chunks.length === 0) {
    return {
      output: { answer: "No source material available yet.", confidence: 0, citations: [] },
    };
  }

  const result = await answerFromKnowledge(
    question,
    chunks.map((c) => ({ content: c.content, source: c.source, confidence: c.confidence }))
  );

  return {
    output: {
      answer: result.answer,
      confidence: result.confidence,
      citations: result.citations,
      caveat: result.caveat,
    },
    markdown: `## Echo Answer\n\n${result.answer}\n\n**Confidence:** ${result.confidence}%\n\n${result.caveat ? `> ${result.caveat}\n\n` : ""}### Citations\n${result.citations.map((c) => `- ${c.source}: "${c.excerpt}"`).join("\n")}`,
  };
}

// ─── Pulse Agent (Slack Monitoring) ──────────────────────────────────

async function executePulse(): Promise<AgentResult> {
  const digest = await generateSlackDigest(4);

  // Build markdown summary
  const lines: string[] = [`## Pulse Digest`, ""];
  lines.push(`**${digest.totalMessages}** messages across **${digest.channelSummaries.length}** channels`);
  lines.push("");

  if (digest.blockers.length > 0) {
    lines.push(`### Blockers (${digest.blockers.length})`);
    for (const msg of digest.blockers) {
      lines.push(`- **#${msg.channelName}**: ${msg.text.slice(0, 120)}`);
    }
    lines.push("");
  }

  if (digest.decisions.length > 0) {
    lines.push(`### Decisions (${digest.decisions.length})`);
    for (const msg of digest.decisions) {
      lines.push(`- **#${msg.channelName}**: ${msg.text.slice(0, 120)}`);
    }
    lines.push("");
  }

  if (digest.mentions.length > 0) {
    lines.push(`### Direct Mentions (${digest.mentions.length})`);
    for (const msg of digest.mentions) {
      lines.push(`- **#${msg.channelName}**: ${msg.text.slice(0, 120)}`);
    }
    lines.push("");
  }

  if (digest.channelSummaries.length > 0) {
    lines.push("### Channel Activity");
    for (const ch of digest.channelSummaries.sort((a, b) => b.count - a.count)) {
      lines.push(`- **#${ch.channel}**: ${ch.count} messages`);
    }
  }

  const hasUrgent = digest.blockers.length > 0 || digest.mentions.length > 0;

  return {
    output: {
      totalMessages: digest.totalMessages,
      channels: digest.channelSummaries.length,
      blockers: digest.blockers.length,
      decisions: digest.decisions.length,
      mentions: digest.mentions.length,
      important: digest.importantMessages.length,
    },
    markdown: lines.join("\n"),
    needsApproval: hasUrgent,
    approvalType: hasUrgent ? "urgent-alert" : undefined,
    approvalTitle: hasUrgent
      ? `Pulse: ${digest.blockers.length} blockers, ${digest.mentions.length} mentions need review`
      : undefined,
    approvalDescription: hasUrgent
      ? "Pulse detected urgent items in Slack that may need your attention."
      : undefined,
  };
}

// ─── Dispatch Helper ────────────────────────────────────────────────

export async function dispatchAgentRun(
  agentId: string,
  agentSlug: string,
  trigger: string,
  input: Record<string, unknown> = {}
) {
  const run = await db.agentRun.create({
    data: {
      agentId,
      status: "QUEUED",
      trigger,
      input: jsonValue(input),
    },
  });

  await agentQueue.add(
    `${agentSlug}-${run.id}`,
    {
      runId: run.id,
      agentId,
      agentSlug,
      trigger,
      input,
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    }
  );

  return run;
}

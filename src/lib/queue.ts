import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "./db";
import { sendTelegramAlert } from "./telegram";
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

// ─── Agent Execution Dispatcher ─────────────────────────────────────

async function executeAgent(
  slug: string,
  _input: Record<string, unknown>
): Promise<{
  output?: Record<string, unknown>;
  markdown?: string;
  needsApproval?: boolean;
  approvalType?: string;
  approvalTitle?: string;
  approvalDescription?: string;
}> {
  void _input;
  // Each agent would be its own module — this is the dispatch point
  // In production, each case would import and call the agent's execute function
  switch (slug) {
    case "chief-of-staff":
      return { output: { briefing: "Morning briefing generated", timestamp: new Date().toISOString() } };
    case "pulse":
      return { output: { digest: "Slack digest generated", channels_scanned: 5 } };
    case "scribe":
      return {
        output: { summary: "Meeting summarized", action_items: 3 },
        needsApproval: true,
        approvalType: "follow-up-draft",
        approvalTitle: "Review follow-up email draft",
        approvalDescription: "Scribe generated a follow-up email from the latest meeting",
      };
    case "closer":
      return {
        output: { deals_scored: 12, stale_deals: 2 },
        needsApproval: true,
        approvalType: "stage-change",
        approvalTitle: "Review deal stage changes",
        approvalDescription: "Closer recommends moving 2 deals to next stage",
      };
    case "scout":
      return { output: { competitors_scanned: 8, opportunities_found: 3 } };
    case "creator":
      return {
        output: { scripts_generated: 2 },
        needsApproval: true,
        approvalType: "script",
        approvalTitle: "Review generated content scripts",
        approvalDescription: "Creator generated 2 new scripts for review",
      };
    case "ghost":
      return { output: { briefs_prepared: 1, sources: 12 } };
    case "echo":
      return { output: { answer: "Based on source material...", confidence: 0.87 } };
    default:
      return { output: { status: "unknown agent" } };
  }
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

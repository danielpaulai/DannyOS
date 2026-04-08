import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { agentId } = await request.json();

  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Create a new run
  const run = await db.agentRun.create({
    data: {
      agentId: agent.id,
      status: "QUEUED",
      trigger: "manual",
      startedAt: new Date(),
    },
  });

  // Update agent status
  await db.agent.update({
    where: { id: agent.id },
    data: { status: "RUNNING", lastRunAt: new Date() },
  });

  // In production, this would dispatch to BullMQ
  // For now, simulate a completed run after creation
  await db.agentRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      durationMs: 1200,
      output: { triggered: true, manual: true },
    },
  });

  await db.agent.update({
    where: { id: agent.id },
    data: { status: "IDLE" },
  });

  return Response.json({ runId: run.id, status: "completed" });
}

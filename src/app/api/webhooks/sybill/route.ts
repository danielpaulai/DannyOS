import { db } from "@/lib/db";
import { NextRequest } from "next/server";

// Sybill webhook — triggers Scribe agent when a meeting transcript is ready
export async function POST(request: NextRequest) {
  const payload = await request.json();

  // Verify webhook secret
  const secret = request.headers.get("x-webhook-secret");
  if (process.env.SYBILL_WEBHOOK_SECRET && secret !== process.env.SYBILL_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Store the transcript
  const transcript = await db.transcript.create({
    data: {
      source: "sybill",
      rawText: payload.transcript ?? "",
      summary: payload.summary,
      actionItems: payload.action_items ?? [],
      metadata: payload,
      meeting: {
        create: {
          title: payload.meeting_title ?? "Untitled Meeting",
          scheduledAt: payload.meeting_time ? new Date(payload.meeting_time) : new Date(),
          platform: payload.platform ?? "unknown",
          status: "completed",
        },
      },
    },
  });

  // Trigger Scribe agent
  const scribe = await db.agent.findUnique({ where: { slug: "scribe" } });
  if (scribe) {
    await db.agentRun.create({
      data: {
        agentId: scribe.id,
        status: "QUEUED",
        trigger: "webhook",
        input: { transcriptId: transcript.id },
      },
    });
  }

  return Response.json({ transcriptId: transcript.id, status: "queued" });
}

import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { approvalId, status } = await request.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const approval = await db.approval.update({
    where: { id: approvalId },
    data: {
      status,
      decidedAt: new Date(),
      decidedBy: "dashboard-user",
    },
  });

  // If the run was waiting for approval, resume it
  if (approval.runId) {
    const newRunStatus = status === "APPROVED" ? "COMPLETED" : "FAILED";
    await db.agentRun.update({
      where: { id: approval.runId },
      data: {
        status: newRunStatus,
        completedAt: new Date(),
        ...(status === "REJECTED" && { error: "Approval rejected" }),
      },
    });
  }

  return Response.json({ approvalId: approval.id, status: approval.status });
}

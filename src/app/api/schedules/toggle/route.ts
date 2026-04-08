import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { jobId, enabled } = await request.json();

  const job = await db.scheduledJob.update({
    where: { id: jobId },
    data: { enabled },
  });

  return Response.json({ jobId: job.id, enabled: job.enabled });
}

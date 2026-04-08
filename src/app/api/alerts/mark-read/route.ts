import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { alertIds } = await request.json();

  await db.alert.updateMany({
    where: { id: { in: alertIds } },
    data: { read: true },
  });

  return Response.json({ marked: alertIds.length });
}

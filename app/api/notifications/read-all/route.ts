import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/notifications/read-all — mark all unread APP notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.notificationLog.updateMany({
    where: {
      userId:  session.user.id,
      channel: "APP",
      status:  { not: "READ" },
    },
    data: { status: "READ" },
  });

  return NextResponse.json({ ok: true });
}
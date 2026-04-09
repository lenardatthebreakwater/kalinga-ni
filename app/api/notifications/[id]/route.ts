import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/notifications/[id] — mark one notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Make sure the notification belongs to this user
  const notif = await db.notificationLog.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!notif) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.notificationLog.update({
    where: { id: params.id },
    data:  { status: "READ" },
  });

  return NextResponse.json({ notification: updated });
}
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unreadCount = await db.notification.count({
      where: { userId: session.id, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("GET notifications error:", error)
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADVERTISER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const { briefVO, briefJJ } = await req.json()

    // Update both individual fields and the combined briefContent for legacy support
    const briefContent = `[ BRIEF JEDAG-JEDUG (JJ) ]\n${briefJJ}\n\n------------------------------------------------------------\n\n[ BRIEF VOICE OVER (VO) ]\n${briefVO}`

    const updated = await db.adRequest.update({
      where: { id },
      data: {
        briefVO,
        briefJJ,
        briefContent,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update brief error:", error)
    return NextResponse.json({ error: "Gagal update brief" }, { status: 500 })
  }
}

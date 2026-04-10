import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const templates = await db.briefTemplate.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil template" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADVERTISER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { type, name, content } = await req.json()
    if (!type || !name || !content) {
      return NextResponse.json({ error: "Field wajib diisi" }, { status: 400 })
    }

    const template = await db.briefTemplate.create({
      data: { type, name, content },
    })

    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat template" }, { status: 500 })
  }
}

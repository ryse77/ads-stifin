import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, name, password, role, city } = await req.json()

    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const validRoles = ["PROMOTOR", "KONTEN_KREATOR", "ADVERTISER", "STIFIN"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }

    const user = await db.user.create({
      data: { email, name, password, role, city: city || null },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 })
  }
}

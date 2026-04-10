import { NextResponse } from "next/server"
import { createToken } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 })
    }

    // Password check: plain text for demo, or bcrypt hash
    let isValid = false
    if (user.password.startsWith("$2")) {
      const bcrypt = await import("bcryptjs")
      isValid = await bcrypt.default.compare(password, user.password)
    } else {
      isValid = user.password === password
    }

    if (!isValid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 })
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("[LOGIN] Error:", error)
    return NextResponse.json({ error: "Gagal login" }, { status: 500 })
  }
}

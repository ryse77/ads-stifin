import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "stifin-secret-key-2025-super-secret"

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  city?: string | null
}

export async function login(email: string, password: string): Promise<JWTPayload | null> {
  try {
    const { PrismaClient } = await import("@prisma/client")
    const globalForPrisma = globalThis as unknown as { prisma: any }
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient()
    }
    const user = await globalForPrisma.prisma.user.findUnique({ where: { email } })
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
    }
  } catch (error) {
    console.error("[AUTH] Login error:", error)
    return null
  }
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyToken(token)
}

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "roy@stifin.com" } })
  console.log("User:", user)

  if (user) {
    console.log("Stored Password Starts With:", user.password.substring(0, 5))
    const isValid = await bcrypt.compare("password123", user.password)
    console.log("IsValid:", isValid)
  }
}

main()

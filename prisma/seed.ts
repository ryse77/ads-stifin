import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create demo users
  const promotor1 = await prisma.user.upsert({
    where: { email: "roy@stifin.com" },
    update: {},
    create: {
      email: "roy@stifin.com",
      name: "Roy",
      password: hashedPassword,
      role: "PROMOTOR",
      city: "Jakarta",
    },
  })

  const promotor2 = await prisma.user.upsert({
    where: { email: "sari@stifin.com" },
    update: {},
    create: {
      email: "sari@stifin.com",
      name: "Sari",
      password: hashedPassword,
      role: "PROMOTOR",
      city: "Bandung",
    },
  })

  const kontenKreator = await prisma.user.upsert({
    where: { email: "creator@stifin.com" },
    update: {},
    create: {
      email: "creator@stifin.com",
      name: "Admin Creator",
      password: hashedPassword,
      role: "KONTEN_KREATOR",
    },
  })

  const advertiser = await prisma.user.upsert({
    where: { email: "ads@stifin.com" },
    update: {},
    create: {
      email: "ads@stifin.com",
      name: "Admin Ads",
      password: hashedPassword,
      role: "ADVERTISER",
    },
  })

  const stifin = await prisma.user.upsert({
    where: { email: "admin@stifin.com" },
    update: {},
    create: {
      email: "admin@stifin.com",
      name: "STIFIn Admin",
      password: hashedPassword,
      role: "STIFIN",
    },
  })

  console.log("✅ Users created:")
  console.log(`  - ${promotor1.email} (PROMOTOR)`)
  console.log(`  - ${promotor2.email} (PROMOTOR)`)
  console.log(`  - ${kontenKreator.email} (KONTEN_KREATOR)`)
  console.log(`  - ${advertiser.email} (ADVERTISER)`)
  console.log(`  - ${stifin.email} (STIFIN)`)
  console.log("  Password: password123")
  console.log("🎉 Seed completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { autoSelectBriefType, generateBriefContent } from "@/lib/brief-templates"
import { createNotification, notifyRole, notifyStifin } from "@/lib/notifications"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const city = searchParams.get("city")
    const status = searchParams.get("status")
    const scope = searchParams.get("scope") // "all" for global historical data

    const where: any = {}

    if (session.role === "PROMOTOR" && scope !== "all") {
      where.promotorId = session.id
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" }
    }

    if (status) {
      where.status = status
    }

    // Auto-update scheduled ads to running if time is up
    const scheduledAds = await db.adRequest.findMany({
      where: {
        status: "IKLAN_DIJADWALKAN",
        adStartDate: { lte: new Date() },
      },
    })

    if (scheduledAds.length > 0) {
      for (const ad of scheduledAds) {
        await db.adRequest.update({
          where: { id: ad.id },
          data: { status: "IKLAN_BERJALAN" },
        })
        
        // Notify promotor that ad is now running
        await createNotification(
          ad.promotorId,
          "Iklan Sedang Berjalan",
          `Iklan Anda untuk ${ad.city} kini telah aktif dan sedang berjalan.`,
          "AD_RUNNING",
          ad.id
        )
      }
    }

    const adRequests = await db.adRequest.findMany({
      where,
      include: {
        promotor: { select: { id: true, name: true, email: true, city: true } },
        adReport: true,
        promotorResult: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(adRequests)
  } catch (error) {
    console.error("GET ad-requests error:", error)
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PROMOTOR") {
      return NextResponse.json({ error: "Hanya Promotor yang dapat membuat pengajuan" }, { status: 403 })
    }

    const { city, startDate, durationDays, dailyBudget } = await req.json()

    if (!city || !startDate || !durationDays || !dailyBudget) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    const totalBudget = dailyBudget * durationDays
    const ppn = Math.round(totalBudget * 0.11)
    const totalPayment = totalBudget + ppn

    const startDateObj = new Date(startDate)
    const briefType = autoSelectBriefType()
    const briefContent = generateBriefContent(briefType, city, startDateObj)

    const adRequest = await db.adRequest.create({
      data: {
        city,
        startDate: startDateObj,
        durationDays,
        dailyBudget,
        totalBudget,
        ppn,
        totalPayment,
        briefType,
        briefContent,
        promotorId: session.id,
      },
      include: {
        promotor: { select: { name: true } },
      },
    })



    // Notify advertiser
    await notifyRole(
      "ADVERTISER",
      "Pengajuan Iklan Baru",
      `${adRequest.promotor.name} dari ${city} mengajukan iklan. Menunggu pembayaran & konten.`,
      "AD_REQUEST",
      adRequest.id
    )

    await notifyStifin(
      "Pengajuan Iklan Baru",
      `Promotor ${adRequest.promotor.name} dari ${city} mengajukan iklan senilai Rp ${totalPayment.toLocaleString("id-ID")}`,
      "AD_REQUEST"
    )

    return NextResponse.json(adRequest, { status: 201 })
  } catch (error) {
    console.error("POST ad-requests error:", error)
    return NextResponse.json({ error: "Gagal membuat pengajuan" }, { status: 500 })
  }
}

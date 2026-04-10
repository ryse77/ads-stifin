import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification, notifyStifin } from "@/lib/notifications"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADVERTISER") {
      return NextResponse.json({ error: "Hanya Advertiser yang dapat submit laporan" }, { status: 403 })
    }

    const { id } = await params
    const { cpr, totalLeads, amountSpent } = await req.json()

    if (cpr === undefined || totalLeads === undefined || amountSpent === undefined) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    const adRequest = await db.adRequest.findUnique({
      where: { id },
      include: { promotor: true },
    })

    if (!adRequest) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    if (adRequest.status !== "IKLAN_BERJALAN") {
      return NextResponse.json({ error: "Iklan belum berjalan" }, { status: 400 })
    }

    const report = await db.adReport.upsert({
      where: { adRequestId: id },
      update: { cpr, totalLeads, amountSpent },
      create: { adRequestId: id, cpr, totalLeads, amountSpent },
    })

    await db.adRequest.update({
      where: { id },
      data: { status: "SELESAI" },
    })

    // Notify promotor
    await createNotification(
      adRequest.promotorId,
      "Iklan Selesai - Input Hasil",
      `Iklan Anda untuk ${adRequest.city} telah selesai. Silakan input jumlah klien yang didapat.`,
      "AD_COMPLETE",
      id
    )

    await notifyStifin(
      "Laporan Iklan Masuk",
      `Laporan iklan ${adRequest.city} - CPR: ${cpr}, Leads: ${totalLeads}, Spent: Rp ${Number(amountSpent).toLocaleString("id-ID")}`,
      "REPORT"
    )

    return NextResponse.json(report)
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json({ error: "Gagal submit laporan" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyStifin } from "@/lib/notifications"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PROMOTOR") {
      return NextResponse.json({ error: "Hanya Promotor yang dapat input hasil" }, { status: 403 })
    }

    const { id } = await params
    const { totalClients, note } = await req.json()

    if (!totalClients) {
      return NextResponse.json({ error: "Jumlah klien wajib diisi" }, { status: 400 })
    }

    const adRequest = await db.adRequest.findUnique({
      where: { id },
      include: { promotor: true },
    })

    if (!adRequest || adRequest.promotorId !== session.id) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    const existingResult = await db.promotorResult.findUnique({
      where: { adRequestId: id },
    })

    const data = {
      totalClients,
      note,
      status: "PENDING",
      previousTotalClients: existingResult?.status === "VALID" ? existingResult.totalClients : existingResult?.previousTotalClients,
    }

    const result = await db.promotorResult.upsert({
      where: { adRequestId: id },
      update: data,
      create: { ...data, adRequestId: id },
    })

    await notifyStifin(
      "Hasil Promotor",
      `Promotor ${adRequest.promotor.name} dari ${adRequest.city} mendapatkan ${totalClients} klien.`,
      "PROMOTOR_RESULT"
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Promotor result error:", error)
    return NextResponse.json({ error: "Gagal input hasil" }, { status: 500 })
  }
}

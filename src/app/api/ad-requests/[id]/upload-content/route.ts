import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification, notifyRole, notifyStifin } from "@/lib/notifications"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "KONTEN_KREATOR") {
      return NextResponse.json({ error: "Hanya Konten Kreator yang dapat upload konten" }, { status: 403 })
    }

    const { id } = await params
    const { contentUrl } = await req.json()

    if (!contentUrl) {
      return NextResponse.json({ error: "File konten wajib diupload" }, { status: 400 })
    }

    const adRequest = await db.adRequest.findUnique({
      where: { id },
      include: { promotor: true },
    })

    if (!adRequest) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    if (adRequest.status !== "DIPROSES") {
      return NextResponse.json({ error: "Pengajuan belum dalam proses" }, { status: 400 })
    }

    const updated = await db.adRequest.update({
      where: { id },
      data: {
        contentUrl,
        status: "KONTEN_SELESAI",
      },
      include: { promotor: true },
    })

    // Notify promotor
    await createNotification(
      adRequest.promotorId,
      "Konten Selesai!",
      `Konten iklan untuk ${adRequest.city} sudah selesai. Download konten Anda di dashboard.`,
      "CONTENT_READY",
      id
    )

    // Notify advertiser
    await notifyRole(
      "ADVERTISER",
      "Konten Siap Dijadwalkan",
      `Konten iklan ${adRequest.promotor.name} dari ${adRequest.city} sudah siap. Segera jadwalkan!`,
      "AD_REQUEST",
      id
    )

    await notifyStifin(
      "Konten Selesai",
      `Konten iklan untuk ${adRequest.city} oleh ${adRequest.promotor.name} sudah selesai dibuat.`,
      "CONTENT_READY"
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Upload content error:", error)
    return NextResponse.json({ error: "Gagal upload konten" }, { status: 500 })
  }
}

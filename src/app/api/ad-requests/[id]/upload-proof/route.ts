import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PROMOTOR") {
      return NextResponse.json({ error: "Hanya Promotor yang dapat upload bukti" }, { status: 403 })
    }

    const { id } = await params
    const { paymentProofUrl } = await req.json()

    if (!paymentProofUrl) {
      return NextResponse.json({ error: "Bukti transfer wajib diupload" }, { status: 400 })
    }

    const adRequest = await db.adRequest.findUnique({ where: { id } })
    if (!adRequest || adRequest.promotorId !== session.id) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    if (adRequest.status !== "MENUNGGU_PEMBAYARAN") {
      return NextResponse.json({ error: "Status pengajuan tidak valid" }, { status: 400 })
    }

    const updated = await db.adRequest.update({
      where: { id },
      data: {
        paymentProofUrl,
        status: "MENUNGGU_KONTEN",
      },
      include: { promotor: true },
    })

    // Notify konten kreator
    const creators = await db.user.findMany({ where: { role: "KONTEN_KREATOR" } })
    for (const creator of creators) {
      await createNotification(
        creator.id,
        "Pengajuan Iklan Baru",
        `${updated.promotor.name} dari ${updated.city} mengajukan iklan baru. Siap diproses!`,
        "AD_REQUEST",
        id
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Upload proof error:", error)
    return NextResponse.json({ error: "Gagal upload bukti" }, { status: 500 })
  }
}

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Master Brief Templates...")

  const voTemplates = [
    {
      name: "Standard VO 1",
      content: `#Brief Video 1 - VO {city}

--------------------------------------

"Hai Warga {city}!
Saatnya kenali potensi terbaik dalam dirimu lewat Tes STIFIn!

Kenali potensi alami dan karakter bawaanmu lewat Tes STIFIn – Tes Minat & Bakat Genetik.

Catat jadwalnya ya!
📅 {day}, {date} - di Kota {city}!

"Bawa keluarga, pasangan, atau sahabatmu biar sama-sama kenal potensi masing-masing. Karena perubahan besar dimulai dari mengenal diri sendiri."

Temukan keunikan dirimu, pahami cara belajar paling efektif,
dan mulai arahkan masa depanmu sesuai dengan mesin kecerdasan genetikmu.

✨ Info dan pendaftaran klik tombol di bawah ini ya!
Tes STIFIn — Kenali Dirimu, Maksimalkan Hidupmu.`
    },
    {
      name: "Standard VO 2",
      content: `#Brief Video 2 - VO {city}

--------------------------------------

Hai Warga {city}!
"Kalau ada cara ilmiah buat tahu bakat dan cara belajar anak cuma dalam 15 menit, kamu mau coba?"

"Banyak orang tua baru sadar bakat anaknya ketika sudah remaja, atau bahkan setelah kuliah.
Padahal mengenali potensi itu paling baik dilakukan saat sejak dini.

Dengan Tes STIFIn, Anda bisa tahu sejak awal:
apa bakat alaminya, cara belajar paling cocok, dan lingkungan yang membuatnya berkembang maksimal.

Catat jadwalnya ya!
📅 {day}, {date} - di Kota {city}!

Jangan tunggu nanti. Anak tumbuh cepat, waktu tak bisa diulang.
✨ Klik tombol di bawah dan mulai langkah kecil untuk masa depan anak lewat Tes STIFIn.`
    },
    {
      name: "Standard VO 3",
      content: `#Brief Video 3 - VO {city}

--------------------------------------

Hai Warga {city}!

Sudah siap menemukan rahasia terbesar dalam dirimu?

Saatnya kenali potensi terbaik dan karakter bawaanmu yang unik lewat Tes STIFIn – Tes Minat & Bakat Genetik!

Catat tanggalnya ya :
📅 {day}, {date} - di Kota {city}!

Ajak seluruh keluarga, pasangan, atau sahabatmu. Kenapa? Karena perubahan besar dimulai dari mengenal diri sendiri. Mari sama-sama kita pahami keunikan masing-masing!

Temukan cara belajar paling efektif dan mesin kecerdasan genetik untuk mengoptimalkan masa depanmu!

✨ Jangan tunda lagi! Info dan pendaftaran, segera klik tombol di bawah ini!

Tes STIFIn: Kenali Dirimu, Maksimalkan Potensimu!`
    }
  ]

  const jjTemplates = [
    {
      name: "Standard JJ 1",
      content: `1. {city}: {day}, {date}
- 1 konten JJ sound teet toot teet
- 1 konten JJ sound random
- 1 konten JJ sound random`
    },
    {
      name: "Standard JJ 2",
      content: `2. {city}: {day}, {date}
- 1 konten JJ sound yali yali
- 1 konten JJ sound random
- 1 konten JJ sound random`
    }
  ]

  for (const t of voTemplates) {
    await prisma.briefTemplate.create({
      data: {
        type: "VO",
        name: t.name,
        content: t.content
      }
    })
  }

  for (const t of jjTemplates) {
    await prisma.briefTemplate.create({
      data: {
        type: "JJ",
        name: t.name,
        content: t.content
      }
    })
  }

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

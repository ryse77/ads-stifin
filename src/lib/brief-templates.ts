export function getDayName(date: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return days[date.getDay()]
}

export function formatDateID(date: Date): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function generateBriefJJ(city: string, date: Date): string {
  const day = getDayName(date)
  const dateStr = formatDateID(date)
  
  const var1 = `1. ${city}: ${day}, ${dateStr}
- 1 konten JJ sound teet toot teet
- 1 konten JJ sound random
- 1 konten JJ sound random`

  const var2 = `2. ${city}: ${day}, ${dateStr}
- 1 konten JJ sound yali yali
- 1 konten JJ sound random
- 1 konten JJ sound random`

  const selected = Math.random() < 0.5 ? var1 : var2;

  return `[ BRIEF JEDAG-JEDUG (JJ) ]
${selected}`
}

export function generateBriefVO(city: string, date: Date): string {
  const day = getDayName(date)
  const dateStr = formatDateID(date)

  const var1 = `#Brief Video 1 - VO ${city}

--------------------------------------

"Hai Warga ${city}!
Saatnya kenali potensi terbaik dalam dirimu lewat Tes STIFIn!

Kenali potensi alami dan karakter bawaanmu lewat Tes STIFIn – Tes Minat & Bakat Genetik.

Catat jadwalnya ya!
📅 ${day}, ${dateStr} - di Kota ${city}!

"Bawa keluarga, pasangan, atau sahabatmu biar sama-sama kenal potensi masing-masing. Karena perubahan besar dimulai dari mengenal diri sendiri."

Temukan keunikan dirimu, pahami cara belajar paling efektif,
dan mulai arahkan masa depanmu sesuai dengan mesin kecerdasan genetikmu.

✨ Info dan pendaftaran klik tombol di bawah ini ya!
Tes STIFIn — Kenali Dirimu, Maksimalkan Hidupmu.`

  const var2 = `#Brief Video 2 - VO ${city}

--------------------------------------

Hai Warga ${city}!
"Kalau ada cara ilmiah buat tahu bakat dan cara belajar anak cuma dalam 15 menit, kamu mau coba?"

"Banyak orang tua baru sadar bakat anaknya ketika sudah remaja, atau bahkan setelah kuliah.
Padahal mengenali potensi itu paling baik dilakukan saat sejak dini.

Dengan Tes STIFIn, Anda bisa tahu sejak awal:
apa bakat alaminya, cara belajar paling cocok, dan lingkungan yang membuatnya berkembang maksimal.

Catat jadwalnya ya!
📅 ${day}, ${dateStr} - di Kota ${city}!

Jangan tunggu nanti. Anak tumbuh cepat, waktu tak bisa diulang.
✨ Klik tombol di bawah dan mulai langkah kecil untuk masa depan anak lewat Tes STIFIn.`

  const var3 = `#Brief Video 3 - VO ${city}

--------------------------------------

Hai Warga ${city}!

Sudah siap menemukan rahasia terbesar dalam dirimu?

Saatnya kenali potensi terbaik dan karakter bawaanmu yang unik lewat Tes STIFIn – Tes Minat & Bakat Genetik!

Catat tanggalnya ya :
📅 ${day}, ${dateStr} - di Kota ${city}!

Ajak seluruh keluarga, pasangan, atau sahabatmu. Kenapa? Karena perubahan besar dimulai dari mengenal diri sendiri. Mari sama-sama kita pahami keunikan masing-masing!

Temukan cara belajar paling efektif dan mesin kecerdasan genetik untuk mengoptimalkan masa depanmu!

✨ Jangan tunda lagi! Info dan pendaftaran, segera klik tombol di bawah ini!

Tes STIFIn: Kenali Dirimu, Maksimalkan Potensimu!`

  const options = [var1, var2, var3];
  const selected = options[Math.floor(Math.random() * options.length)];

  return `[ BRIEF VOICE OVER (VO) ]\n\n${selected}`;
}

export function getBriefForAdvertiser(city: string, date: Date): string {
  const day = getDayName(date)
  const dateStr = formatDateID(date)
  return `📅 ${day}, ${dateStr} - di Kota ${city}!`
}

export function autoSelectBriefType(): string {
  return "JJ & VO"
}

export function generateBriefs(city: string, date: Date) {
  return {
    jj: generateBriefJJ(city, date),
    vo: generateBriefVO(city, date)
  };
}

export function generateBriefContent(briefType: string, city: string, date: Date): string {
  const { jj, vo } = generateBriefs(city, date);
  return `${jj}\n\n------------------------------------------------------------\n\n${vo}`;
}

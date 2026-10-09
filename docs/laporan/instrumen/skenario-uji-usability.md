# Instrumen — Skenario Tugas (Usability)

Bagian dari paket pengujian Tahap 8. Dipakai bersama `lembar-observasi.md` dan
`kuesioner-sus.md`.

**Peserta:** 5–8 siswa SMP (dengan izin sekolah/orang tua), ditambah 1–2 guru bila memungkinkan.
**Metode:** _think-aloud_ — peserta diminta membacakan apa yang sedang dipikirkan selama mengerjakan
tugas. Pemandu **tidak** memberi bantuan kecuali peserta sudah terhenti > 60 detik; bantuan yang
diberikan dicatat di lembar observasi.

**Perangkat uji:** laptop/literasi digital sekolah, dan satu perangkat Android (Chrome) untuk
tugas T3. Aplikasi dijalankan dari URL hasil `pnpm preview`/deploy (mode lokal: `http://localhost:4173`).

---

## Pra-uji: kuis singkat pemahaman konsep (5 butir)

Jawab dulu sebelum memakai aplikasi; diulang sebagai pasca-uji setelah tugas selesai.

1. Data pribadi adalah … (a) data yang membuat orang bisa **mengenali/melacak** seseorang ·
   (b) data tentang cuaca · (c) data aplikasi game
2. Contoh data pribadi tingkat **tinggi** adalah … (a) warna kesukaan · (b) alamat rumah lengkap ·
   (c) hobi
3. Saat bertanya ke AI untuk tugas sekolah, sebaiknya kamu … (a) menyalin seluruh data keluarga ·
   (b) mengganti nama/alamat dengan keterangan umum · (c) tidak usah memikirkannya
4. Chat dengan AI biasanya … (a) tersimpan di server penyedia · (b) hilang selamanya ·
   (c) hanya tersimpan di HP-mu
5. Foto profil, nomor WhatsApp, dan nama lengkap termasuk … (a) bukan data pribadi ·
   (b) data pribadi · (c) data rahasia negara

Kunci jawaban: 1-a, 2-b, 3-b, 4-a, 5-b.

---

## Tugas utama

### T1 — Kerjakan skenario mudah (± 3 menit)

**Instruksi peserta:** _"Buka menu Skenario, pilih skenario mudah 'Perkenalan Diri', baca
situasinya, lalu putuskan nasib setiap bagian pesan yang kamu anggap terlalu pribadi. Setelah
semua bagian diputuskan, kirim jawabanmu dan lihat hasilnya."_

| Kriteria keberhasilan                                                     | Ukuran           |
| ------------------------------------------------------------------------- | ---------------- |
| Berhasil memilih skenario dan membuka latihan                             | ya / tidak       |
| Menemukan & memutuskan **minimal 3 dari 4** segmen sensitif               | jumlah segmen    |
| Mengirim jawaban dan mencapai halaman hasil                               | ya / tidak       |
| Waktu penyelesaian                                                        | detik            |
| Jumlah kesalahan (klik keliru, salah menu, harus dibantu)                 | jumlah + catatan |
| Pemahaman: peserta dapat menyebutkan **1 alasan** memilih "hapus"/"ganti" | kutipan          |

### T2 — Gunakan petunjuk dan membaca umpan balik (± 3 menit)

**Instruksi peserta:** _"Sekarang ulangi latihan pada skenario yang sama, tetapi nyalakan dulu
fitur Petunjuk. Setelah melihat hasil, bacakan satu contoh umpan balik yang kamu dapat untuk sebuah
bagian pesan, dan jelaskan skor yang kamu peroleh."_

| Kriteria keberhasilan                            | Ukuran                   |
| ------------------------------------------------ | ------------------------ |
| Menemukan & menyalakan tombol petunjuk           | ya / tidak, detik        |
| Berhasil menafsirkan skor total/privasi/kegunaan | benar / salah / sebagian |
| Menyebutkan contoh umpan balik per segmen        | kutipan                  |
| Waktu penyelesaian                               | detik                    |
| Kesalahan                                        | jumlah + catatan         |

### T3 — Ekspor hasil dan cek riwayat (± 3 menit)

**Instruksi peserta:** _"Ambil hasil terakhirmu, ekspor ke PDF, lalu buka menu Riwayat dan
tentukan percobaan mana skor tertinggimu. Terakhir, ubah ukuran teks di Pengaturan menjadi lebih
besar dan katakan apakah halaman berubah."_

| Kriteria keberhasilan                        | Ukuran            |
| -------------------------------------------- | ----------------- |
| Menemukan menu ekspor dan memilih PDF        | ya / tidak, detik |
| Berkas benar-benar terunduh                  | ya / tidak        |
| Membuka Riwayat dan menemukan skor tertinggi | benar / salah     |
| Menemukan Pengaturan & mengubah ukuran teks  | ya / tidak        |
| Perubahan teks terlihat oleh peserta         | ya / tidak        |
| Waktu penyelesaian                           | detik             |
| Kesalahan                                    | jumlah + catatan  |

### T4 (opsional, untuk guru) — Menyiapkan bahan ajar (± 5 menit)

**Instruksi:** _"Baca halaman Panduan, lalu jelaskan dengan bahasamu sendiri bagaimana cara guru
memakai aplikasi ini di kelas dan apa yang bisa didiskusikan setelah murid melihat hasilnya."_

Ukur: kelengkapan jawaban (mencakup privasi data, diskusi hasil, keempat format ekspor).

---

## Panduan pemandu

- **Think-aloud:** minta peserta berbicara; diamkan bila lancar.
- **Bila terhenti > 60 detik:** beri petunjuk bertingkat dan catat tingkatnya —
  _H1: arah umum_ ("coba lihat di bagian atas") · _H2: lokasi_ ("tombolnya di sebelah kanan") ·
  _H3: ditunjuk langsung_. Semakin banyak H, semakin buruk kemudahan pemakaian.
- **Setiap tugas:** catat waktu, kesalahan, kutipan peserta, dan ekspresi kebingungan di
  `lembar-observasi.md`.
- Jangan menunjukkan fungsi yang belum diminta; jangan membetulkan pendapat peserta.

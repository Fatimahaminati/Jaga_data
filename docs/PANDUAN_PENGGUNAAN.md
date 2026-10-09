# Panduan Penggunaan

**Jaga Data!** adalah web latihan untuk siswa SMP: berlatih mengenali dan menyunting data pribadi
sebelum pesan dikirim ke AI.

> Semua nama, alamat, nomor, dan identitas dalam latihan adalah **data fiktif**.
> Semua data latihanmu **tetap di perangkatmu**.

---

## Untuk siswa

### Alur singkat

1. **Pilih skenario** di menu `Skenario`. Ada tiga tingkat: Mudah, Sedang, Sulit.
2. **Baca layar pengantar** "Sebelum mulai": tur tiga langkah dan maksimal dua tujuan belajar.
3. **Baca pesannya** per bagian (indikator _Bagian x dari y_), lalu klik/ketuk bagian yang
   menurutmu berisi data pribadi.
4. **Pilih tindakan** untuk bagian itu (tiga tombol besar):
   - **Pertahankan** — tetap dikirim apa adanya.
   - **Hapus** — bagian dibuang dari pesan.
   - **Samarkan** — pilih pengganti yang lebih umum (mis. `[alamat rumah]`,
     `kota Semarang saja`). Saat menyorot atau memilih sebuah opsi, muncul pratinjau
     **"Kalimat jadinya"** lengkap dengan kalimat sekitarnya; penanda kualitasnya
     (_Masih terlalu jelas_ / _Cukup aman_ / _Aman_) baru tampil setelah kamu memilih,
     lalu tekan **Pakai opsi ini** untuk mengunci pilihanmu.
     > Di layar sempit, kotak popover bisa digulir ke dalam (geser di dalam kotaknya)
     > untuk mencapai pratinjau, tombol **Pakai opsi ini**, dan tombol **Tutup**.
5. **Pantau tab Sebelum & Sesudah** — pesanmu harus tetap masuk akal.
6. Tekan **Kirim ke AI simulasi** untuk melihat hasilnya.

### Membaca hasil

| Elemen                        | Arti                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Skor total**                | `0.7 × skor privasi + 0.3 × skor kegunaan`, dikurangi 5 bila mode petunjuk dipakai |
| **Skor privasi**              | Seberapa baik data pribadimu dilindungi                                            |
| **Skor kegunaan**             | Seberapa tetap berguna pesanmu untuk AI                                            |
| **Lencana**                   | `Pemula` (< 50), `Waspada` (50–79), `Penjaga Data` (≥ 80)                          |
| **3 hal untuk diperbaiki**    | Tiga keputusan yang paling perlu kamu perbaiki (ringkas)                           |
| **Penjelasan tiap keputusan** | Verdict (Tepat / Cukup baik / Keliru), alasannya, dan tipsnya — di dalam accordion |

Rincian (per segmen, ringkasan pesan, skor privasi & kegunaan) disembunyikan di balik tombol
**Lihat penjelasan** supaya layar utama lega.

### Mode petunjuk

Tombol **Beri petunjuk** menyorot bagian yang berisiko dengan garis putus-putus. Skor akhir
berkurang sedikit, supaya tantangannya tetap adil. Guru dapat menonaktifkan mode ini lewat
**Panduan → Pengaturan → Izinkan mode petunjuk**.

### Menyimpan dan mengirim hasil

- **Draf tersimpan otomatis** setiap kali kamu memilih tindakan — kamu bisa menutup tab dan
  melanjutkan nanti (Beranda menampilkan tombol _Lanjutkan mengerjakan_).
- Di halaman **Hasil**, tekan **Ekspor hasil** untuk mengunduh:
  - **PDF** — ringkasan skor, sebelum/sesudah, umpan balik.
  - **PNG** — kartu hasil, cocok untuk diunggah ke kelas.
  - **JSON** — data lengkap percobaan.
- Di halaman **Riwayat**, tersedia **CSV** (riwayat ringkas) dan **JSON**.

Semua ekspor dihitung dan diunduh di perangkatmu sendiri.

### Riwayat

Menu `Riwayat` menampilkan total percobaan, skor terbaik, rata-rata, jumlah skenario yang sudah
selesai, daftar kartu tiap percobaan, serta grafik perkembangan skor (di dalam accordion). Kamu
bisa menghapus satu percobaan atau semua riwayat (dengan konfirmasi).

### Pengaturan (ikon gerigi di pojok kanan atas)

| Pengaturan             | Fungsi                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| Nama panggilan         | **Opsional.** Jangan gunakan nama lengkap.                                        |
| Ukuran teks            | **Normal (bawaan)** / Besar / Sangat besar — hanya memperbesar teks (×1,1 / ×1,2) |
| Mode kontras tinggi    | Garis lebih tebal, latar putih, teks hitam                                        |
| Izinkan mode petunjuk  | Menampilkan/menyembunyikan tombol petunjuk                                        |
| Hapus semua data lokal | Mengosongkan riwayat, draf, dan pengaturan                                        |

### Aksesibilitas

- Seluruh fitur bisa dijalankan dengan **papan ketik**: `Tab` untuk berpindah, `Enter`/`Space`
  untuk memilih, `Esc` untuk menutup popover/dialog.
- Target sentuh minimal **44 px**, nyaman untuk layar ponsel.
- Mode kontras tinggi dan tiga ukuran teks tersedia di Pengaturan.

---

## Untuk guru

### Penggunaan di kelas/lab

1. Buka URL aplikasi di browser lab — **tidak perlu akun, tidak perlu pendaftaran**.
2. Minta siswa mengerjakan tiga skenario secara berurutan.
3. Setiap siswa mengekspor hasilnya (PNG/PDF/CSV) sebagai bukti/bahan refleksi.

### Saran aktivitas

| Fase  | Kegiatan                                                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Pra   | Tanyakan: "Apa saja yang sebenarnya tidak perlu diketik ke AI?"                                                                    |
| Inti  | Siswa mengerjakan skenario 1 → 2 → 3 dengan _think-aloud_                                                                          |
| Pasca | Bandingkan skor privasi vs kegunaan: siapa yang mendapat badge _Penjaga Data_? Mengapa skor kegunaan turun kalau semuanya dihapus? |

### Konsep yang dibahas aplikasi ini

Data pribadi, data orang lain, mengganti dengan keterangan umum, dan bahaya menggabungkan
banyak detail. Penjelasannya ada di menu **Panduan**.

### Privasi

Aplikasi tidak mengumpulkan data siswa sedikit pun: tidak ada server, tidak ada akun, tidak ada
cookie pelacak, tidak ada analitik. Riwayat hanya ada di `localStorage` masing-masing browser dan
bisa dihapus kapan saja. Karena itu aplikasi ini **tidak cocok** untuk kebutuhan yang menuntut
pengumpulan nilai siswa secara terpusat — gunakan ekspor CSV manual bila perlu.

### Menjalankan secara lokal (opsional)

Bila sekolah ingin menjalankan di server sendiri, lihat [`INSTALASI.md`](INSTALASI.md).
Aplikasi ini berupa file statis; bisa juga disimpan di USB dan dibuka langsung
(dengan menyalakan izin file-protocol pada browser, atau lewat `pnpm preview`).

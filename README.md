# Jaga Data! — Latihan Perlindungan Data Pribadi saat Menggunakan AI

Web latihan interaktif untuk siswa SMP: menemukan data pribadi yang tersembunyi di dalam pesan,
memutuskan nasibnya satu per satu (pertahankan / hapus / ganti dengan keterangan umum), lalu melihat
skor privasi, skor kegunaan, badge, dan penjelasan tiap keputusan.

> **Aplikasi statis, 100% di sisi klien.** Tanpa backend, tanpa API AI, tanpa autentikasi, tanpa
> analitik. Tidak ada skrip, font, atau gambar dari domain pihak ketiga. Semua data siswa tidak
> pernah meninggalkan perangkat.

## Fitur

| Fitur                  | Keterangan                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| 3 skenario             | Mudah, sedang, sulit — seluruhnya data fiktif                                                               |
| Editor token           | Klik/ketuk tiap bagian pesan → Pertahankan, Hapus, atau Samarkan (pilih pengganti umum + pratinjau kalimat) |
| Pratinjau real-time    | Panel **Sebelum & Sesudah** terupdate setiap keputusan                                                      |
| Engine penilaian       | Murni TypeScript, berbasis aturan, deterministik: skor privasi + skor kegunaan + badge                      |
| Umpan balik per segmen | Verdict, alasan risiko, dan tips praktis                                                                    |
| Penyimpanan lokal      | Draf otomatis, riwayat percobaan, pengaturan — semua di `localStorage`                                      |
| Ekspor                 | PDF, PNG, JSON, CSV (semuanya dihitung di perangkat)                                                        |
| Aksesibilitas          | Navigasi papan ketik penuh, target sentuh ≥ 44 px, mode kontras tinggi, tiga ukuran teks                    |

## Ringkasan arsitektur

```
Presentation   pages/, features/, components/
Application    stores/ (Zustand), hooks/
Domain         domain/        ← pure TS: TIDAK boleh impor React/DOM/localStorage
Infrastructure infra/         ← StorageRepository, exporter
Content        content/       ← skenario, kamus string Bahasa Indonesia, tips
```

Aturan dependensi: panah hanya ke bawah. Rincian lengkap ada di [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md)
dan daftar keputusan (ADR) di [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Memulai cepat

Prasyarat: **Node.js LTS (≥ 20)** dan **pnpm**.

```bash
pnpm install      # instal dependensi
pnpm dev          # server pengembangan → http://localhost:5173
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (unit + test komponen)
pnpm test:coverage # test + laporan cakupan (threshold 80%)
pnpm build        # build produksi ke dist/
pnpm preview      # pratinjau hasil build
pnpm bundle:report # ukur payload awal (gzip) hasil build
```

> Catatan: pada mesin tertentu pnpm hanya tersedia lewat `corepack pnpm`.

## Struktur proyek

```
src/
├── main.tsx, App.tsx, routes.tsx
├── domain/          # pure TS: types, scoring engine, buildPreview, skema Zod
├── content/         # scenarios/, strings/id.ts, tips.ts
├── infra/           # storage/ (StorageRepository, migrations), export/ (JSON/CSV/PDF/PNG)
├── stores/          # sessionStore, progressStore, settingsStore (Zustand + persist)
├── features/        # scenarios/, editor/, feedback/, history/, export/
├── pages/           # Home, Scenarios, Practice, Result, History, Guide, NotFound
├── components/      # ui/ (Button, Card, Dialog, Tabs, Pill), layout/ (AppShell, Header, Footer)
├── hooks/, utils/, styles/
```

## Dokumentasi

| Dokumen                                                    | Isi                                        |
| ---------------------------------------------------------- | ------------------------------------------ |
| [`docs/INSTALASI.md`](docs/INSTALASI.md)                   | Instalasi, menjalankan, build, deploy      |
| [`docs/PANDUAN_PENGGUNAAN.md`](docs/PANDUAN_PENGGUNAAN.md) | Panduan siswa & guru                       |
| [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md)                 | Ringkasan arsitektur dan alur data         |
| [`docs/MENAMBAH_SKENARIO.md`](docs/MENAMBAH_SKENARIO.md)   | Cara menulis skenario baru                 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)                   | Catatan keputusan (ADR)                    |
| [`docs/laporan/`](docs/laporan/)                           | Laporan pengujian fungsi & usability (SUS) |

## Prinsip privasi

- Tidak ada data siswa yang dikirim keluar perangkat.
- Tidak ada akun, tidak ada cookie pelacak, tidak ada analitik.
- Riwayat, draf, dan pengaturan hanya di `localStorage` browser ini, dan bisa dihapus kapan saja
  lewat **Panduan → Pengaturan → Hapus semua data lokal**.
- Semua nama, alamat, nomor, dan identitas dalam latihan adalah **data fiktif**.

## Lisensi

Digunakan untuk keperluan pembelajaran/skripsi.
"# Jaga_data" 

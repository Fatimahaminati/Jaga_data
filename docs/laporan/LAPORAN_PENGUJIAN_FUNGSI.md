# Laporan Pengujian Fungsi

**Proyek:** Pengembangan Media Web Interaktif untuk Pembelajaran Perlindungan Data Pribadi saat
Menggunakan AI pada Siswa SMP (`pdp-ai-literacy`)
**Tanggal pengujian:** 29 September 2026 · **Pembaruan terakhir:** 13 Oktober 2026
**Status:** Tahap 7 selesai — semua kasus uji prioritas tinggi lulus

---

## 1. Ringkasan eksekutif

| Aspek                          | Hasil                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Test otomatis                  | **52 berkas, 437 test — semuanya lulus**                                               |
| Cakupan kode (V8)              | **99,64% statements · 96,00% branches · 98,49% functions** (target ≥ 80%)              |
| Lighthouse (Chrome 154)        | Performance **0,99** · Accessibility **1,00** · Best Practices **1,00** · SEO **1,00** |
| Lighthouse (Edge 154)          | Performance **0,99** · Accessibility **1,00** · Best Practices **1,00** · SEO **1,00** |
| Payload awal (gzip)            | **104,2 KB** (target < 200 KB)                                                         |
| Request pihak ketiga           | **0**                                                                                  |
| Error console saat smoke test  | **0**                                                                                  |
| Bug ditemukan selama pengujian | **15** — 15 diperbaiki, 0 tersisa                                                      |

---

## 2. Lingkungan pengujian

| Item           | Keterangan                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Sistem operasi | Windows 11 Home Single Language 10.0.26200                                                          |
| Node.js        | v24.16.0                                                                                            |
| Paket manager  | pnpm 12.6.0 (via `corepack pnpm`)                                                                   |
| Peramban 1     | Google Chrome 154.0.8037.58 (headless untuk Lighthouse, jendela biasa untuk smoke test)             |
| Peramban 2     | Microsoft Edge 154.0.4258.37 (headless, `CHROME_PATH` menunjuk ke `msedge.exe`)                     |
| Server uji     | `pnpm preview` (produksi hasil `pnpm build`) di `http://localhost:4173`, plus `pnpm dev` di `:5173` |
| Alat bantu     | Vitest 2.1.9 + Testing Library 16, Lighthouse CLI 13.5.0, `scripts/bundle-report.mjs`               |

Perintah yang dipakai untuk verifikasi berulang:

```bash
pnpm format:check   # prettier
pnpm lint           # eslint (termasuk eslint-plugin-jsx-a11y)
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm test:coverage  # vitest run --coverage (memakai threshold 80/75/80/80)
pnpm build          # tsc --noEmit && vite build
```

---

## 3. Metode dan cakupan pengujian

1. **Unit test** — lapisan `src/domain` (mesin penilaian, skema Zod, preview) dan `src/infra`
   (penyimpanan, ekspor, migrasi). Murni logika, tanpa DOM.
2. **Test komponen/halaman** — `@testing-library/react` + `user-event` pada `src/components`,
   `src/features`, `src/pages`, `src/stores`, `src/hooks`, `src/routes.tsx`, `src/App.tsx`.
   Mencakup interaksi papan ketik (Escape pada dialog/popover, Tab, panah) karena jsdom tidak
   punya sentuhan.
3. **Smoke test manual di peramban** — alur end-to-end: Beranda → Skenario → Latihan → popover →
   Kirim → Hasil → Riwayat → Panduan → 404 → Pengaturan, pada mode dev dan mode preview.
   Verifikasi lewat snapshot aksesibilitas, evaluasi DOM, dan pembacaan konsol.
4. **Audit otomatis** — Lighthouse (4 kategori) di 5 rute, pada 2 mesin peramban.
5. **Uji ketahanan** — data localStorage sengaja dirusak, lalu aplikasi dimuat ulang.

> **Catatan cakupan:** Playwright/e2e ditunda (ADR-003 di `docs/DECISIONS.md`), sehingga kasus
> uji alur end-to-end diverifikasi lewat test komponen setingkat halaman (yang merender route
> dengan `MemoryRouter`) dan smoke test manual — bukan test peramban penuh.

---

## 4. Tabel kasus uji

Keterangan status: **LULUS** = sesuai harapan · **DIPERBAIKI** = gagal saat pengujian awal, lalu
diperbaiki dan diuji ulang menjadi lulus.

### 4.1 Alur utama (Fungsi)

| ID      | Deskripsi                 | Langkah                                                 | Hasil diharapkan                                                                                                                                                                                                | Hasil aktual                                     | Status |
| ------- | ------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------ |
| FUNC-01 | Beranda memuat            | Buka `#/`                                               | Judul hero, 3 langkah cara kerja, CTA terlihat                                                                                                                                                                  | Sama; LCP 1,66 dtk                               | LULUS  |
| FUNC-02 | Pilih skenario            | Klik "Mulai latihan" → pilih skenario mudah             | Berpindah ke `#/latihan/:id`, konteks & tujuan tampil                                                                                                                                                           | Sama (`PracticePage.test`, smoke)                | LULUS  |
| FUNC-03 | Membuka popover tindakan  | Klik salah satu segmen pesan                            | Popover terbuka, fokus masuk ke isinya, 3 tindakan tersedia                                                                                                                                                     | Sama (`ActionPopover.test`, 17 test)             | LULUS  |
| FUNC-04 | Keputusan "hapus"         | Pilih tindakan hapus                                    | Keputusan tersimpan, progres bertambah, preview berubah                                                                                                                                                         | Sama (`PracticePage.test`)                       | LULUS  |
| FUNC-05 | Keputusan "samarkan"      | Pilih Samarkan → sorot/pilih opsi → "Pakai opsi ini"    | Opsi tampil tangga keumuman, pratinjau "Kalimat jadinya" mengikuti pilihan, penanda kualitas muncul **setelah** dipilih, label pengganti menggantikan teks segmen                                               | Sama (`ActionPopover.test`, `PracticePage.test`) | LULUS  |
| FUNC-19 | Pratinjau & penanda opsi  | Buka Samarkan, sorot beberapa opsi, lalu pilih satu     | Kotak pratinjau selalu tampil (teks dasar sebelum disorot; sesudah disorot berisi segmen sebelum + opsi + segmen sesudah); belum dipilih → tanpa penanda & tanpa `onChange`; tombol konfirmasi menunggu pilihan | Sama (`ActionPopover.test`, 5 test baru)         | LULUS  |
| FUNC-06 | Keputusan "pertahankan"   | Pilih pertahankan                                       | Keputusan tercatat sebagai dipertahankan                                                                                                                                                                        | Sama                                             | LULUS  |
| FUNC-07 | Undo / redo / hapus semua | Klik Urungkan, Ulangi, lalu "hapus semua" + konfirmasi  | Riwayat keputusan mengikuti tombol; hapus semua mengosongkan setelah konfirmasi                                                                                                                                 | Sama (`PracticePage.test`)                       | LULUS  |
| FUNC-08 | Mode petunjuk             | Nyalakan petunjuk, kerjakan, kirim                      | Petunjuk aktif → skor total dikurangi penalti 5 poin                                                                                                                                                            | Sama (ADR-005, `engine.test`)                    | LULUS  |
| FUNC-09 | Kirim jawaban             | Klik Kirim                                              | Percobaan tersimpan, draf dihapus, pindah ke `#/hasil/:attemptId`                                                                                                                                               | Sama                                             | LULUS  |
| FUNC-10 | Halaman hasil             | Setelah kirim                                           | Skor total/privasi/kegunaan, badge, umpan balik per segmen, sebelum/sesudah dengan penanda benar/sebagian/keliru                                                                                                | Sama (`ResultPage.test`, 15 test)                | LULUS  |
| FUNC-11 | Coba lagi                 | Klik "Coba lagi"                                        | Sesi baru untuk skenario sama, keputusan kosong                                                                                                                                                                 | Sama                                             | LULUS  |
| FUNC-12 | Skenario berikutnya       | Klik tombol di hasil                                    | Menuju skenario berikutnya sesuai tingkat kesulitan                                                                                                                                                             | Sama                                             | LULUS  |
| FUNC-13 | Persistensi riwayat       | Selesai 1 percobaan → muat ulang halaman → buka Riwayat | Percobaan tetap ada (localStorage `pdp:attempts`)                                                                                                                                                               | Sama (manual, preview)                           | LULUS  |
| FUNC-14 | Grafik perkembangan       | Buka Riwayat dengan ≥ 2 percobaan                       | Grafik SVG sumbu + titik skor terender                                                                                                                                                                          | Sama (`ScoreChart.test`)                         | LULUS  |
| FUNC-15 | Hapus riwayat             | Klik hapus → konfirmasi                                 | Data terhapus hanya setelah konfirmasi                                                                                                                                                                          | Sama (`HistoryTable.test`)                       | LULUS  |
| FUNC-16 | Rute tak dikenal          | Buka `#/halaman-tidak-ada`                              | Halaman 404 dengan tautan kembali                                                                                                                                                                               | Sama (`routes.test`, Lighthouse SEO 1,00)        | LULUS  |
| FUNC-17 | Panduan & privasi         | Buka `#/panduan`                                        | Tujuan belajar, cara pakai, pernyataan data tidak meninggalkan perangkat                                                                                                                                        | Sama (`GuidePage.test`)                          | LULUS  |
| FUNC-18 | Tiga skenario valid       | Muat aplikasi                                           | 3 skenario (mudah, sedang, sulit) lolos skema Zod                                                                                                                                                               | Sama (7 test skema + render `ScenariosPage`)     | LULUS  |

### 4.2 Mesin penilaian & preview

| ID       | Deskripsi               | Langkah                                         | Hasil diharapkan                                              | Hasil aktual                               | Status |
| -------- | ----------------------- | ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ | ------ |
| SCORE-01 | Skor privasi & kegunaan | 20 kombinasi kasus pada `score`/`scoreScenario` | Bobot 0,7 privasi + 0,3 kegunaan                              | 20/20 lulus                                | LULUS  |
| SCORE-02 | Ambang badge            | Skor 49 / 50 / 79 / 80                          | Badge berubah pada 50 dan 80                                  | Sesuai (`badgeFor`)                        | LULUS  |
| SCORE-03 | Penalti hint            | Total 80 dengan hint aktif                      | Menjadi 75 (−5)                                               | Sesuai, `HINT_PENALTY` diimpor dari config | LULUS  |
| SCORE-04 | Umpan balik kosong      | Segmen non-sensitif (`feedback: ''`)            | Teks generik `strings.result.neutralFeedback`                 | Sesuai (ADR-006)                           | LULUS  |
| SCORE-05 | Galat penilaian         | Aturan tidak cocok (`judgeSegment`)             | `ScoringError` dilempar, ditangani halaman hasil              | 6 test jalur galat lulus                   | LULUS  |
| PREV-01  | Preview sebelum/sesudah | Bangun preview dari keputusan                   | Teks asli, teks hasil sunting, penanda status per segmen      | 6 test `buildPreview` lulus                | LULUS  |
| PREV-02  | Kepatuhan skenario      | Validasi 3 berkas skenario                      | Tidak ada field terlarang, `options` wajib ada di tiap segmen | 26 test skema lulus                        | LULUS  |

### 4.3 Ekspor

| ID     | Deskripsi              | Langkah                                 | Hasil diharapkan                                       | Hasil aktual                                                     | Status |
| ------ | ---------------------- | --------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- | ------ |
| EXP-01 | Ekspor PDF             | Pada hasil, pilih "Ekspor PDF"          | Berkas `.pdf` terunduh, berisi skor & feedback         | 6 test `exportPdf` (jsPDF di-mock) lulus; smoke: berkas terunduh | LULUS  |
| EXP-02 | Ekspor PNG             | Pilih "Ekspor PNG"                      | Berkas `.png` dari kartu hasil                         | 3 test `exportPng` lulus                                         | LULUS  |
| EXP-03 | Ekspor JSON            | Pilih "Ekspor JSON"                     | JSON valid berisi percobaan + metadata                 | 4 test (round-trip parse) lulus                                  | LULUS  |
| EXP-04 | Ekspor CSV             | Pilih "Ekspor CSV"                      | CSV dengan header & satu baris per percobaan           | 3 test lulus; kolom diekspor sesuai header                       | LULUS  |
| EXP-05 | Tombol ekspor nonaktif | Buka ekspor tanpa data                  | Item nonaktif + pesan penjelas, bukan error            | `ExportMenu.test` lulus                                          | LULUS  |
| EXP-06 | Galat ekspor           | Simulasikan modul ekspor melempar error | Pesan gagal tampil (role status), aplikasi tidak crash | `ResultPage.test` — "menampilkan pesan gagal…" lulus             | LULUS  |

### 4.4 Penyimpanan lokal & ketahanan

| ID      | Deskripsi                   | Langkah                                                                 | Hasil diharapkan                                                                  | Hasil aktual                                                                       | Status |
| ------- | --------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| STOR-01 | Draf otomatis               | Buat keputusan saat latihan                                             | Draf tersimpan di `pdp:draft`                                                     | Lulus (`PracticePage.test`, `useAutosaveDraft.test`)                               | LULUS  |
| STOR-02 | Pengaturan persisten        | Ubah nickname, ukuran teks, kontras → muat ulang                        | Nilai dipulihkan lalu diterapkan (kontras → `<html>`, ukuran → `data-font-scale`) | Lulus (`App.test`, `SettingsForm.test`, manual preview)                            | LULUS  |
| STOR-03 | JSON rusak                  | Set `pdp:settings` = `{not-json`, muat ulang                            | Aplikasi tetap jalan dengan nilai default, kunci dibersihkan                      | Aplikasi terender normal, kunci dihapus; halaman Riwayat tetap tampil (uji manual) | LULUS  |
| STOR-04 | Data salah tipe             | Set `pdp:attempts` = `{"state":{"attempts":"bukan-array"},"version":1}` | Dibaca sebagai data kosong tanpa crash                                            | Riwayat menampilkan "Belum ada riwayat", tanpa error konsol (uji manual)           | LULUS  |
| STOR-05 | localStorage diblokir       | `localStorage.setItem` melempar (uji)                                   | Fallback memori, aplikasi tetap berjalan                                          | 14 test `localStorageRepo` + `SettingsForm` lulus                                  | LULUS  |
| STOR-06 | Kuota penuh                 | `QuotaExceededError` saat menulis                                       | Fallback memori, fungsi `write` mengembalikan `false`                             | Lulus (test `failOnWrite`)                                                         | LULUS  |
| STOR-07 | Amplop versi lama           | Baca kunci dengan versi lawas                                           | Diteruskan ke `migrate`, lalu state valid                                         | 6 test `repoPersistStorage` + 7 test `migrations` lulus                            | LULUS  |
| STOR-08 | Data korup dihapus otomatis | `read` menerima JSON valid tetapi melanggar skema                       | Kunci dihapus, `null` dikembalikan                                                | Lulus (`localStorageRepo.test`)                                                    | LULUS  |

### 4.5 Pengaturan, papan ketik, dan aksesibilitas

| ID      | Deskripsi                | Langkah                                                    | Hasil diharapkan                                                                                           | Hasil aktual                                                                               | Status         |
| ------- | ------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------- |
| SET-01  | Batas nickname           | Ketik > 24 karakter                                        | Dibatasi 24 karakter                                                                                       | Lulus (`SettingsForm.test`)                                                                | LULUS          |
| SET-02  | Skala teks               | Pilih Normal / Besar / Sangat besar                        | Atribut `data-font-scale` berubah (faktor 1 / 1,1 / 1,2) yang mengalikan `--fs-*`; `<html>` tidak disentuh | Lulus (`App.test`, `settingsStore.test`)                                                   | LULUS          |
| SET-03  | Kontras tinggi           | Aktifkan mode kontras                                      | Atribut `data-contrast="high"` terpasang                                                                   | Lulus (manual: atribut terpasang, checkbox bisa diklik)                                    | LULUS          |
| KEY-01  | Dialog pengaturan        | Tab ke tombol Pengaturan → Enter → Escape                  | Terbuka, fokus terkunci di dalam, Escape menutup & fokus kembali                                           | Lulus (`Dialog.test`, `Header.test`)                                                       | LULUS          |
| KEY-02  | Popover tindakan         | Enter pada segmen → panah → Escape                         | Navigasi bekerja, fokus kembali ke pemicu                                                                  | Lulus (`ActionPopover.test`)                                                               | LULUS          |
| KEY-03  | Skip link                | Tab pertama di halaman                                     | "Langsung ke konten utama" terlihat dan menuju `<main>`                                                    | Lulus (`AppShell.test`)                                                                    | LULUS          |
| A11Y-01 | Nama tombol ikon         | Audit halaman dengan lebar 412 px (label teks tersembunyi) | Tombol/nav punya nama aksesibel                                                                            | **GAGAL** → `aria-label` ditambahkan ke logo, 4 nav, tombol Pengaturan                     | **DIPERBAIKI** |
| A11Y-02 | Kontras teks kecil       | Audit kontras Lighthouse                                   | Rasio ≥ 4,5                                                                                                | **GAGAL** (4,46 pada `text-ink-500` di `bg-ink-50`) → `ink.500` diubah ke `#5f6c85` (4,94) | **DIPERBAIKI** |
| A11Y-03 | Kontras teks sekunder    | Periksa pemakaian `text-ink-400`                           | Semua teks memakai `ink-500`                                                                               | **GAGAL** (5 pemakaian: HistoryTable, HistoryPage, ScoreChart ×2, ActionPopover) → diganti | **DIPERBAIKI** |
| A11Y-04 | Lighthouse Accessibility | Audit `#/`, `#/skenario`, `#/riwayat`, `#/panduan`, 404    | ≥ 0,99                                                                                                     | **1,00 di kelima rute** (Chrome & Edge)                                                    | LULUS          |
| A11Y-05 | Struktur semantik        | Audit otomatis + eslint jsx-a11y                           | Tanpa pelanggaran kritis                                                                                   | Tanpa temuan (`button-name`, `link-name`, `color-contrast` = 1)                            | LULUS          |

### 4.6 Performa & keamanan aplikasi

| ID      | Deskripsi                       | Langkah                                             | Hasil diharapkan                            | Hasil aktual                                                                                                                                                                                                                                               | Status         |
| ------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| PERF-01 | Payload awal                    | `node scripts/bundle-report.mjs`                    | < 200 KB gzip                               | **104,2 KB** gzip                                                                                                                                                                                                                                          | LULUS          |
| PERF-02 | Lighthouse Performance (Chrome) | Audit `#/`                                          | ≥ 0,90                                      | **0,99** (FCP 1,51 dtk · LCP 1,66 dtk · TBT 30 ms · CLS 0)                                                                                                                                                                                                 | LULUS          |
| PERF-03 | Lighthouse Performance (Edge)   | Audit `#/`                                          | ≥ 0,90                                      | **GAGAL 0,86** → CLS 0,235 karena `HomePage` lazy: fallback Suspense menampilkan kartu kecil, footer di posisi atas, lalu bergeser turun saat chunk masuk. **Diperbaiki** dengan mengimpor `HomePage` secara eager (ADR-011) → diuji ulang **0,99, CLS 0** | **DIPERBAIKI** |
| PERF-04 | Code splitting halaman lain     | Periksa `dist/`                                     | Halaman lain tetap terpisah                 | 6 chunk halaman tetap lazy (`ScenariosPage`, `PracticePage`, `ResultPage`, `HistoryPage`, `GuidePage`, `ExportMenu`)                                                                                                                                       | LULUS          |
| PERF-05 | Lazy load modul berat           | Periksa `dist/`                                     | jsPDF & html2canvas tidak ikut payload awal | Keduanya chunk terpisah, dimuat saat ekspor dipakai                                                                                                                                                                                                        | LULUS          |
| NET-01  | Tanpa pihak ketiga              | Evaluasi `performance.getEntriesByType('resource')` | Hanya origin sendiri                        | `external: []` (0 request)                                                                                                                                                                                                                                 | LULUS          |
| NET-02  | Konsol bersih                   | Baca konsol tab preview setelah smoke test          | Tanpa error                                 | 0 pesan di `localhost:4173`                                                                                                                                                                                                                                | LULUS          |
| SEC-01  | Header keamanan                 | Periksa `_headers`                                  | CSP + header keamanan tersedia              | Berkas `_headers` ada di root proyek                                                                                                                                                                                                                       | LULUS          |

---

## 5. Ringkasan cakupan otomatis

Hasil `pnpm test:coverage` (provider V8, seluruh `src/**` kecuali `main.tsx` dan
`ErrorBoundary` — keduanya diverifikasi lewat test tersendiri/smoke test):

| Kelompok                                          | Statements | Branch     | Functions  |
| ------------------------------------------------- | ---------- | ---------- | ---------- |
| **Seluruh berkas**                                | **99,64%** | **96,00%** | **98,49%** |
| `src/domain`                                      | 98,37%     | 93,52%     | 100%       |
| `src/infra`                                       | 100%       | 96,49%     | 100%       |
| `src/components`                                  | 99,11%     | 97,50%     | 100%       |
| `src/features`                                    | 99,89%     | 96,06%     | 100%       |
| `src/pages`                                       | 100%       | 95,48%     | 95,83%     |
| `src/stores`                                      | 100%       | 96,10%     | 100%       |
| `src/content`                                     | 99,56%     | 94,12%     | 83,33%     |
| `src/hooks`, `src/utils`, `App.tsx`, `routes.tsx` | 100%       | 100%       | 100%       |

Angka per kelompok dapat dihitung ulang kapan saja dengan
`node scripts/coverage-groups.mjs` (membaca `coverage/coverage-summary.json`).

Threshold di `vitest.config.ts` (statements 80 · branches 75 · functions 80 · lines 80) terpenuhi
dengan selisih lebar. Sisa baris tak tercakup adalah cabang defensif yang tidak terjangkau di
jsdom (mis. `localStorage` diblokir total saat inisialisasi) dan cabang default yang selalu
dipanggil dengan argumen eksplisit.

---

## 6. Hasil Lighthouse (rute dan peramban)

| Rute                  | Chrome — Perf | Chrome — A11y | Chrome — BP | Chrome — SEO |
| --------------------- | ------------- | ------------- | ----------- | ------------ |
| `#/`                  | 0,99          | 1,00          | 1,00        | 1,00         |
| `#/skenario`          | —             | 1,00          | 1,00        | 1,00         |
| `#/latihan/:id`       | —             | 1,00          | 1,00        | 1,00         |
| `#/riwayat`           | —             | 1,00          | 1,00        | 1,00         |
| `#/panduan`           | —             | 1,00          | 1,00        | 1,00         |
| `#/halaman-tidak-ada` | —             | 1,00          | 1,00        | 1,00         |

| Peramban (`#/`)      | Performance | Accessibility | Best Practices | SEO  |
| -------------------- | ----------- | ------------- | -------------- | ---- |
| Chrome 154.0.8037.58 | 0,99        | 1,00          | 1,00           | 1,00 |
| Edge 154.0.4258.37   | 0,99        | 1,00          | 1,00           | 1,00 |

> Audit awal Edge sempat gagal pada SEO (`robots-txt`) dan Performance (CLS 0,235). Keduanya
> diperbaiki: `public/robots.txt` ditambahkan dan rute beranda diimpor secara eager.
>
> **Audit ulang setelah penyederhanaan UI (ADR-012):** axe/Lighthouse dijalankan ulang pada
> `#/`, `#/skenario`, `#/latihan/perkenalan-diri` (pengantar & layar editor), `#/riwayat`,
> `#/panduan`, dan 404 — **Accessibility, Best Practices, dan SEO = 1,00 pada seluruh rute,
> 0 kegagalan aturan**.
>
> **Audit ulang setelah sistem font baru (ADR-013) & alur "Samarkan" (ADR-014), 7 Okt 2026:**
> Lighthouse CLI 13.5.0 (Edge headless) di **6 rute** — `#/` = Performance **0,99** ·
> Accessibility **1,00** · Best Practices **1,00** · SEO **1,00**; kelima rute lain =
> Accessibility/Best Practices/SEO **1,00**. Pemeriksaan CDP pada **360 / 768 / 1280 px**
> (7 pemandangan: beranda, skenario, pengantar latihan, editor, riwayat, panduan, 404):
> **0 overflow horizontal, 0 error console, 0 teks < 12 px**; `html` tetap 16 px,
> `body` 15 px, H1 22 px (360 px) / 24 px (≥768 px), H2 18 px, tombol 14 px, label kecil 13 px,
> angka "404"/skor 44 px, `data-font-scale="normal"`.
>
> **Audit ulang setelah perbaikan popover Samarkan (bug 14), 8 Okt 2026:** Lighthouse CLI
> 13.5.0 (Edge headless) di **6 rute** — Performance **0,95–0,97** (semua di atas target 0,90;
> skor performa berfluktuasi antar-jalan), Accessibility/Best Practices/SEO **1,00** pada
> seluruh rute. Pemeriksaan CDP khusus **layar popover Samarkan** pada 360/768/1280 px:
> popover muat penuh (vertikal & horizontal), tersedia gulir internal (maks 45/220/244 px),
> tombol "Pakai opsi ini" & "Tutup" terjangkau setelah digulir, tinggi dan posisi **identik**
> ketika opsi disorot berkali-kali (tidak ada perhitungan ulang posisi → tidak kedap-kedip),
> 0 error console.

---

## 7. Daftar bug dan status perbaikan

| No. | Bug                                                                                                                                                                        | Ditemukan saat       | Severity      | Status                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `ActionPopover.tsx` sintaks rusak (baris 50) — aplikasi tidak bisa dibangun                                                                                                | Perakitan            | Kritis        | Diperbaiki                                                                                                               |
| 2   | `BadgeDisplay` — tipe properti `icon` keliru                                                                                                                               | Typecheck            | Mayor         | Diperbaiki                                                                                                               |
| 3   | `ScenarioList` — impor tak terpakai (gagal lint)                                                                                                                           | Lint                 | Minor         | Diperbaiki                                                                                                               |
| 4   | `ExportMenu` memakai ikon `FileCsv` yang tidak ada di lucide                                                                                                               | Build/lint           | Mayor         | Diperbaiki → `FileSpreadsheet`                                                                                           |
| 5   | `ResultPage` memakai selector store nickname yang salah                                                                                                                    | Smoke test           | Mayor         | Diperbaiki                                                                                                               |
| 6   | Dialog pengaturan tidak terpusat (animasi `transform` menimpa utilitas translate)                                                                                          | Smoke test           | Kritis        | Diperbaiki (ADR-008)                                                                                                     |
| 7   | Kontras `text-ink-500` di `bg-ink-50` = 4,46 (< 4,5)                                                                                                                       | Lighthouse           | Mayor         | Diperbaiki (`ink.500` → `#5f6c85`)                                                                                       |
| 8   | 5 pemakaian `ink-400` untuk teks kecil (kontras 2,96)                                                                                                                      | Pengecekan manual    | Mayor         | Diperbaiki → `ink-500`                                                                                                   |
| 9   | Tombol/nav ikon tanpa nama aksesibel pada lebar < 768 px                                                                                                                   | Lighthouse (mobile)  | Kritis (a11y) | Diperbaiki → `aria-label`                                                                                                |
| 10  | `robots.txt` tidak ada → audit SEO gagal                                                                                                                                   | Lighthouse           | Minor         | Diperbaiki → `public/robots.txt`                                                                                         |
| 11  | CLS 0,235 di Edge akibat `HomePage` lazy                                                                                                                                   | Lighthouse (Edge)    | Mayor         | Diperbaiki → impor eager (ADR-011)                                                                                       |
| 12  | Cakupan test < 80% (belum ada test komponen/halaman)                                                                                                                       | `pnpm test:coverage` | Mayor         | Diperbaiki → 99,64%                                                                                                      |
| 13  | Threshold coverage gagal karena `exportPdf`, `storage.schema`, `repoPersistStorage` belum dites                                                                            | `pnpm test:coverage` | Mayor         | Diperbaiki                                                                                                               |
| 14  | Daftar Samarkan: pratinjau kalimat kedap-kedip & opsi sulit diklik; isi popover meluber keluar layar tanpa bisa digulir (tinggi 772 px di viewport 670 px, posisi `fixed`) | Uji coba di peramban | Kritis (UX)   | Diperbaiki → popover dibatasi `--radix-popper-available-height` + gulir internal, kotak pratinjau tinggi tetap (ADR-014) |

| 15 | Ekspor PNG gagal di produksi (Vercel): `fetch(dataUrl)` melanggar CSP `connect-src 'self'` — Console: _"Connecting to 'data:image/png;base64,…' violates the following Content Security Policy directive"_ | Uji coba di produksi | Kritis (fungsional) | Diperbaiki → konversi lokal `dataUrlToBlob` (`atob` + `Uint8Array` → `Blob`); CSP tidak diubah |

**Bug tersisa: 0.**

---

## 8. Uji lintas peramban dan perangkat

| Target                                          | Status          | Bukti                                                                                                                                                                                                               |
| ----------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome 154 (Windows, desktop)                   | Lulus           | Smoke test manual + Lighthouse 4 kategori                                                                                                                                                                           |
| Edge 154 (Windows, desktop)                     | Lulus           | Lighthouse 4 kategori, semua ≥ 0,99                                                                                                                                                                                 |
| Mode lebar 412 px (emulasi mobile Lighthouse)   | Lulus           | A11y 1,00 — label ikon tersembunyi tetap punya nama                                                                                                                                                                 |
| Lebar 360 / 768 / 1280 px (Edge headless + CDP) | Lulus           | Semua rute (termasuk layar editor): tanpa overflow horizontal, teks < 12 px = 0, error console = 0 (ADR-013); popover Samarkan muat di layar, bisa digulir internal, dan stabil saat opsi disorot (ADR-014, bug 14) |
| Firefox / Safari-WebKit                         | **Belum diuji** | Tidak tersedia di lingkungan pengujian saat ini                                                                                                                                                                     |
| Laptop sekolah & Android fisik                  | **Belum diuji** | Menunggu akses perangkat; tercantum di rencana tindak lanjut                                                                                                                                                        |

Pada Firefox/WebKit pengujian dilakukan dengan pendekatan yang sama: buka `pnpm preview`,
jalankan alur FUNC-01…FUNC-19, lalu audit Lighthouse. Tidak ada API browser-spesifik yang
dipakai selain `localStorage`, `matchMedia`, dan `URL.createObjectURL` — ketiganya sudah punya
fallback di kode.

---

## 9. Keterbatasan dan rencana tindak lanjut

1. **E2E Playwright belum dijalankan** (ditunda, ADR-003). Rencananya meliputi: penyelesaian
   ketiga skenario, keempat format ekspor, persistensi setelah reload, viewport mobile, dan
   audit `axe` — sesuai butir Tahap 7.
2. **Firefox/WebKit & perangkat fisik** — dijadwalkan setelah lingkungan uji tersedia (butir
   Tahap 7.3).
3. **Pengujian usability dengan partisipan** — instrumen sudah disiapkan di
   `docs/laporan/instrumen/`, pelaporan di `docs/laporan/LAPORAN_USABILITY.md` (Tahap 8).
4. **Smoke test produksi/URL publik** — menunggu pen-deploy-an (Tahap 9).

---

## 10. Artefak terkait

- `scripts/bundle-report.mjs` — pengukur payload awal (gzip).
- `coverage/` (dibuat oleh `pnpm test:coverage`) — laporan HTML per berkas.
- `docs/laporan/instrumen/` — skenario tugas, lembar observasi, kuesioner SUS.
- `docs/DECISIONS.md` — ADR-003 (e2e ditunda), ADR-008 (dialog), ADR-011 (beranda eager).

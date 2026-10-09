# Catatan Keputusan (ADR)

Keputusan singkat untuk kondisi yang ambigu atau bertentangan dengan
`arsitektur-web-latihan-pdp-ai.md`. Prinsip yang dipakai: **ambil opsi paling sederhana**,
lalu catat di sini.

Format: **Status** (diterima / ditunda / ditolak) · **Konteks** · **Keputusan** · **Konsekuensi**.

---

## ADR-001: `options` dipindahkan dari blok `sensitive` ke tingkat `Segment`

**Status:** diterima (deviasi dari spesifikasi) · **Tipe:** perubahan model data

**Konteks.**
Spesifikasi (bagian 2.2) menaruh `options: GeneralizeOption[]` di dalam `Segment.sensitive`.
Karena hanya segmen sensitif yang memiliki `sensitive`, popover "Samarkan"
hanya akan menampilkan daftar pengganti pada segmen yang memang data pribadi — **membocorkan
jawabannya ke siswa sebelum mereka sempat menebak**.

**Keputusan.**
`options` ditaruh sebagai properti wajib di `Segment`, sementara `sensitive` tetap opsional:

```ts
export interface Segment {
  id: string
  text: string
  options: GeneralizeOption[] // semua segmen
  sensitive?: { category; level; rule; feedback }
}
```

**Konsekuensi.**

- Popover seragam untuk semua segmen: siswa tidak bisa menyimpulkan data mana yang sensitif.
- Setiap segmen (termasuk pengecoh) butuh minimal tiga opsi, salah satunya `quality: 'poor'`.
- Skema Zod diperbarui; skenario yang sudah ada ditulis ulang mengikuti.
- Tidak ada perubahan pada engine penilaian.

---

## ADR-002: Routing memakai `HashRouter`

**Status:** diterima · **Tipe:** teknologi

**Konteks.**
Spesifikasi merekomendasikan `HashRouter` "bila hosting GitHub Pages", dan menyebut
Cloudflare Pages/Netlify sebagai tujuan utama yang keduanya mendukung _SPA rewrite_.

**Keputusan.**
Pakai `HashRouter` untuk semua kondisi.

**Konsekuensi.**

- URL berbentuk `/#/latihan/perkenalan-diri` — sedikit kurang rapi.
- **Tidak butuh konfigurasi rewrite/404** di host mana pun, termasuk membuka `dist/index.html`
  langsung dari disk (file:// atau USB di lab sekolah).
- Link _deep_ tetap berfungsi tanpa setup server.

---

## ADR-003: Playwright/e2e ditunda

**Status:** ditunda · **Tipe:** cakupan

**Konteks.**
Spesifikasi (Tahap 7) meminta e2e Playwright (Chromium/Firefox/mobile + `axe-core`).
Menambah Playwright berarti mengunduh browser berukuran besar dan menambah konfigurasi CI
yang berat di lingkungan pengembangan terbatas.

**Keputusan.**
Unit test dengan Vitest diprioritaskan; e2e ditunda.

**Konsekuensi.**

- Unit test mencakup `domain/` (engine, preview, skema), `infra/` (storage, ekspor) —
  52 test, semua lulus.
- Alur UI diverifikasi **manual** lewat pemeriksaan aksesibilitas (accessibility snapshot)
  dan pengukuran geometri elemen di browser, bukan otomatis.
- Risiko: regresi UI tidak tertangkap otomatis oleh CI.
- **Tindak lanjut:** tambahkan `playwright.config.ts` + `e2e/*.spec.ts`
  (`scenario-flow`, `export`, `a11y`) sebelum rilis final; CI sudah disiapkan
  dengan tahap `e2e` yang di-skip selama belum ada.

---

## ADR-004: Framer Motion, Radix Tooltip, dan `@fontsource` ditunda

**Status:** diterima · **Tipe:** dependensi

**Konteks.**
Spesifikasi menandai Framer Motion, Tooltip, dan font self-host sebagai opsional.

**Keputusan.**
Tidak dipasang.

**Konsekuensi.**

- Animasi pakai CSS keyframes (`animate-fade-in`, `animate-pop-in`) + hook
  `useReducedMotion`.
- Tooltip diganti dengan teks bantuan (`hint`) yang selalu terlihat / `aria-label`.
- Font memakai stack sistem (`Segoe UI`, `system-ui`, …) sehingga **nol request pihak ketiga**
  dan TTFB lebih cepat. Sudah diverifikasi: `performance.getEntriesByType('resource')`
  tidak menunjukkan satu pun request lintas domain.

---

## ADR-005: Skor total dikurangi penalti hint (5 poin)

**Status:** diterima · **Tipe:** model penilaian

**Konteks.**
Spesifikasi menyebut "pengurangan skor kecil bila hint dipakai" tanpa angka pasti.

**Keputusan.**
`total = 0.7 × privasi + 0.3 × kegunaan − 5` (konstanta `HINT_PENALTY` di
`domain/scoring/config.ts`), difloor di 0.

**Konsekuensi.** Nilai tetap dalam rentang 0–100; badge ikut terpengaruh, sehingga
mode petunjuk memang terasa bedanya tanpa membuat skor mustahil dicapai.

---

## ADR-006: `feedback: ''` untuk segmen non-sensitif

**Status:** diterima · **Tipe:** model data

**Konteks.**
Segmen pengecoh/tanpa `sensitive` tidak punya `FeedbackSpec`, tetapi `SegmentScore.feedback`
bertipe `string`.

**Keputusan.**
Engine mengisi `feedback: ''`, lalu UI memakai teks generik
`strings.result.neutralFeedback[verdict]`.

**Konsekuensi.** Domain tetap murni (tidak mengimpor kamus string), dan teks yang tampil ke
pengguna tetap berada di `content/strings/id.ts`.

---

## ADR-007: Token segmen dirender sebagai baris penuh, bukan chip inline

**Status:** diterima · **Tipe:** UX

**Konteks.**
Spesifikasi (2.5) menyebut segmen tampil sebagai _chip_ yang dapat diklik. Chip inline membuat
target sentuh sulit mencapai 44 px pada ponsel, terutama untuk kalimat panjang.

**Keputusan.**
Tiap segmen adalah tombol `display: flex; width: 100%; min-height: 48px` (kelas `.segment`),
diurutkan vertikal seperti daftar pesan.

**Konsekuensi.** Target sentuh jauh melebihi 44 px, urutan Tab logis, dan teks panjang tetap
terbaca. Pratinjau "sebelum" tetap menyajikan pesan sebagai paragraf utuh.

---

## ADR-008: Animasi dialog tidak boleh memakai `transform`

**Status:** diterima · **Tipe:** bug yang ditemukan saat pengujian

**Konteks.**
Keyframes `pop-in` awalnya menganimasikan `transform: scale(...)`. Karena animasi
meng-override utilitas Tailwind `-translate-x-1/2 -translate-y-1/2`, dialog jadi **tidak
terpusat**: tepi bawahnya keluar layar (terukur `bottom = 933px` pada viewport `700px`)
sehingga checkbox pengaturan tidak bisa diklik.

**Keputusan.**
Gunakan properti CSS mandiri `scale` pada keyframes, sehingga `transform` milik Tailwind
tetap utuh:

```ts
'pop-in': { from: { opacity: '0', scale: '0.96' }, to: { opacity: '1', scale: '1' } }
```

**Konsekuensi.** Dialog terpusat (`top = 76px`, `bottom = 647px` pada viewport `700px`)
dan seluruh kontrolnya dapat diklik. Pelajaran: **jangan mencampur `transform` dari animasi
dengan utilitas positioning Tailwind pada elemen yang sama.**

---

## ADR-009: Tidak ada PWA, IndexedDB, atau Husky

**Status:** diterima · **Tipe:** cakupan

**Konteks.**
Spesifikasi menandai PWA (`vite-plugin-pwa`), IndexedDB/Dexie, dan Git hooks sebagai opsional
atau "hanya jika diperlukan". Riwayat dibatasi 200 percobaan sehingga jauh di bawah kuota
localStorage (~5 MB).

**Keputusan.** Tidak dipasang pada MVP.

**Konsekuensi.**

- Offline: dokumen tetap di-cache browser, tapi tanpa service worker.
- `git commit` tidak memicu lint otomatis; pengembang wajib menjalankan
  `pnpm lint && pnpm typecheck && pnpm test` (diotomatisasi di CI).

---

## ADR-010: Direktori laporan pengujian

**Status:** diterima · **Tipe:** struktur

**Konteks.**
Spesifikasi meminta `docs/laporan/LAPORAN_PENGUJIAN_FUNGSI.md` dan
`docs/laporan/LAPORAN_USABILITY.md` beserta instrumennya.

**Keputusan.**
Struktur folder `docs/laporan/instrumen/` disiapkan, dan isinya diisi oleh tahap pengujian
(Tahap 7 & 8) — **bukan** oleh tahap fondasi.

**Konsekuensi.** Berkas laporan dan kuesioner SUS adalah pekerjaan terpisah yang
membutuhkan data pengujian nyata (partisipan, waktu penyelesaian, skor SUS).

---

## ADR-011: Beranda diimpor secara eager (bukan lazy)

**Status:** diterima (deviasi) · **Tipe:** performa

**Konteks.**
Spesifikasi (Tahap 9.4) meminta _code splitting_ per halaman. Saat seluruh rute — termasuk
`HomePage` — dibungkus `React.lazy`, halaman pendaratan me-render fallback `Suspense` (kartu
kecil) lebih dulu. Ketika chunk beranda selesai dimuat, tinggi konten bertambah dan footer
bergugeser turun: **CLS 0,235** pada audit Lighthouse Edge (target ≤ 0,1), sehingga skor
Performance turun ke 0,86 (DoD mensyaratkan ≥ 0,90).

**Keputusan.**
`HomePage` diimpor langsung di `routes.tsx` (eager); rute lain tetap lazy. Payload awal naik
sekitar 1,8 KB gzip, dengan imbalan CLS 0 dan FCP/LCP yang lebih stabil di peramban dingin.

**Konsekuensi.**

- Beranda selalu terender pada paint pertama → CLS 0 (Chrome & Edge).
- Rute lain tetap terpisah; modul ekspor (jsPDF/html2canvas) tetap lazy.
- Test `routes.test.tsx` disesuaikan: rute `/` tidak lagi menampilkan status memuat.

---

## ADR-012: Penyederhanaan UI untuk siswa SMP (progressive disclosure)

**Status:** diterima · **Tipe:** UX/aksesibilitas

**Konteks.**
Evaluasi awal: tampilan terlalu padat dan terlalu banyak teks untuk siswa SMP kelas 7-9 —
terlalu banyak tombol utama per layar, paragraf panjang, tabel lebar, dan istilah teknis.
Dituntut: satu layar = satu tujuan = satu tombol utama, teks isi minimal 16px dengan ukuran
font default "Besar", line-height 1,6, lebar teks ±65 karakter, serta jarak lebih lega —
tanpa mengubah engine penilaian (`domain/`) atau skema data.

**Keputusan.**

1. **Satu tombol utama per layar** + **progressive disclosure**: detail panjang pindah ke
   accordion reusable `features/disclosure/Disclosure` (label `common.showMore`/`showLess`,
   `aria-expanded`, keyboard-native).
2. **Layar pengantar** (`practice.intro*`) di awal latihan berisi tur 3 langkah + tujuan
   belajar (maksimal 2 butir) — sekaligus memenuhi kebutuhan "tur 3 langkah saat pertama
   kali bermain"; menggantikan blok instruksi panjang dan daftar tujuan di kartu skenario.
3. **"Bagian x dari y"**: segmen dikelompokkan maksimal 3 per bagian di `TokenEditor`
   (indikator `practice.sectionOf`, navigasi Kembali/Lanjut) — murni presentasi, skema data
   segmen tidak berubah.
4. **Pratinjau sebelum/sesudah lewat tab** (`preview.tabBefore`/`tabAfter`), satu panel per
   waktu agar layar tidak padat.
5. **Riwayat: tabel → daftar kartu** (`HistoryList` menggantikan `HistoryTable`).
6. **Tipografi** _(bagian ini digantikan ADR-013)_: ukuran font default = **Besar**
   (`fontScale: 'large'`, rasio **1,15** — dipilih agar `text-sm` terkecil pun menjadi ≥16px
   pada default), seluruh kelas `text-xs` dihapus dari komponen, `body` memakai
   `text-base leading-relaxed`, dan `p`/`li` dibatasi `max-w-[65ch]` lewat CSS global.
7. **Semua teks tetap di `content/strings/id.ts`/berkas skenario**: kunci lama yang tampilnya
   dihapus (statistik beranda, kolom tabel, instruksi panjang) dibuang; kunci baru ditambahkan
   (`intro*`, `sectionOf`, `topTitle`/`topEmpty`, `showMore`/`showLess`, `detailScoresTitle`,
   `history.dateLabel`/`scenarioLabel`, dst.). Istilah teknis dihapus dari teks (mis. judul
   tips "re-identification" → "Waspadai risiko gabungan").

**Konsekuensi.**

- Test naik 411 → **428** (52 berkas), cakupan tetap ≥ 96% semua metrik; lint/typecheck/build
  hijau.
- Pemeriksaan viewport 360px (Chrome/Edge headless + CDP): semua rute **tanpa overflow
  horizontal, tanpa teks < 16px, 0 error console** _(kriteria "teks < 16px" tidak berlaku lagi
  sejak ADR-013 — lihat pemeriksaan 360/768/1280 px di LAPORAN_PENGUJIAN_FUNGSI)_.
- Audit axe ulang (Lighthouse): Accessibility, Best Practices, SEO = **1,00** pada
  `#/`, `#/skenario`, `#/latihan/:id` (pengantar & editor), `#/riwayat`, `#/panduan`, dan 404.

---

## ADR-013: Ukuran font dipusatkan ke variabel CSS (bawaan "Normal")

**Status:** diterima · **Tipe:** UI/aksesibilitas · **Menggantikan** ADR-012 butir 6

**Konteks.**
Diagnosis computed style pada build sebelumnya (Edge headless, 360 & 1280 px):
`App.tsx` menyetel `html { font-size: 1.15rem }` (18,4px) **dan** komponen tetap memakai
utilitas Tailwind berbasis `rem` → setiap ukuran ikut terkalikan 1,15 (**penumpukan**).
Hasilnya: `body` 18,4px, H1 41,4px (34,5px di 360px), lead beranda 20,7px, tombol 18,4–20,7px,
pill 16,1px, serta H1 tidak konsisten antarhalaman (41,4px vs 27,6px). Font terlalu besar dan
melelahkan untuk siswa SMP.

**Keputusan.**

1. **Satu sumber ukuran** di `src/styles/index.css` (semua `rem`, `html` tidak diubah):
   `--fs-body` 0,9375rem · `--fs-editor` 1rem · `--fs-button` 0,875rem · `--fs-small` 0,8125rem ·
   `--fs-h1` 1,5rem (**1,375rem** di layar < 640px) · `--fs-h2` 1,125rem · `--fs-score` 2,75rem.
2. **Utility turunan**: `.fs-body`, `.fs-editor`, `.fs-button`, `.fs-small`, `.fs-h1`, `.fs-h2`,
   `.fs-score`, plus aturan base untuk `body`, `h1`, `h2`, `h3`, `.btn`, `.pill`, `.label-caps`,
   `.segment`, `.preview-text`. Seluruh ukuran ad hoc (`text-sm`…`text-4xl`, termasuk varian
   responsif) dihapus dari komponen — tidak ada ukuran font di luar variabel.
3. **Opsi Pengaturan hanya mengalikan variabel** lewat atribut `data-font-scale`:
   `normal` ×1 (bawaan) · `large` ×1,1 · `xlarge` ×1,2. `settingsStore` default diubah jadi
   `fontScale: 'normal'`; nilai persisten tetap angka (skema data tidak berubah), ambang merge
   diperbarui (≥1,17 → xlarge, ≥1,05 → large) supaya data lama 1,0 / 1,12 / 1,15 / 1,28 tetap
   terbaca benar.
4. **Kepadatan diatur lewat jarak** (padding/margin/gap), bukan dengan memperbesar font.
5. Label teks tetap di `content/strings/id.ts`: `guide.fontScale.normal` = **"Normal"**,
   `large` = "Besar", `xlarge` = "Sangat besar".

**Konsekuensi.**

- Ukuran hasil: body 15px · editor 16px · tombol 14px · label kecil 13px · H1 24px (22px di
  layar kecil) · H2 18px · angka skor 44px; opsi Besar/Sangat besar → 16,5/18px body, dst.
- `body` tetap `leading-relaxed` (1,6) dan `p`/`li` tetap dibatasi `max-w-[65ch]`.
- Uji: `App.test` kini memeriksa `data-font-scale` (bukan `style.fontSize`),
  `settingsStore.test` memeriksa faktor 1 / 1,1 / 1,2 dan ambang merge baru.
- Diuji ulang pada 360px, 768px, dan 1280px + audit axe (lihat LAPORAN_PENGUJIAN_FUNGSI).

---

## ADR-014: Alur "Samarkan" — pratinjau kalimat, tangga keumuman, penanda kualitas

**Status:** diterima · **Tipe:** UX/konten · **Tanpa perubahan** `domain/` & skema data

**Konteks.**
Label tombol "Ganti" terasa kabur bagi siswa, dan opsi penggantinya sering **tidak pas**:
urutan array lama justru `good → acceptable → poor` (kebalikan tangga keumuman), sedangkan
label lama berupa frasa pendek (`salam pembuka`, `halo`, `kota Semarang saja`) yang saat
digabung di pratinjau menjadi kalimat patah. Siswa juga tidak pernah melihat hasil akhir
kalimat sebelum menekan tombol, dan penanda kualitas opsi — bila ditampilkan sebelum
memilih — akan membocorkan jawaban.

**Keputusan.**

1. **Label tombol** `action.generalize`: "Ganti" → **"Samarkan"** (konsep panduan ikut
   disesuaikan: "Samarkan jadi keterangan umum").
2. **Alur dua langkah** di `ActionPopover`: tekan _Samarkan_ → daftar opsi muncul; menyorot
   **atau** memilih opsi langsung menampilkan **pratinjau "Kalimat jadinya"**
   (`contextBefore + " " + label + " " + contextAfter`, konteks dari `TokenEditor` lewat prop
   `contextBefore`/`contextAfter`) → tekan **"Pakai opsi ini"** untuk mengunci.
   Memilih opsi belum memicu `onChange`.
3. **Penanda kualitas hanya setelah dipilih**: `poor` = _Masih terlalu jelas_ (`TriangleAlert`,
   merah) · `acceptable` = _Cukup aman_ (`Shield`, kuning) · `good` = _Aman_ (`ShieldCheck`,
   hijau) — selalu **ikon + warna + teks**, tidak warna saja, dan tidak tampil sebelum siswa
   memilih (agar tidak membocorkan jawaban).
4. **Tangga keumuman**: opsi ditampilkan sesuai urutan array, disusun dari paling spesifik
   ke paling umum (`poor → acceptable → good`).
5. **Penulisan ulang seluruh opsi** di `content/scenarios/*.ts` (28 segmen × 3 opsi):
   label ditulis sebagai bagian kalimat utuh yang nyambung dengan segmen sebelum & sesudah
   (kata sambung, imbuhan, kata depan, kapitalisasi, tanda baca). Semua segmen — termasuk
   pengecoh netral — tetap punya minimal 1 `poor` dan 1 `good` (syarat Zod), dan tetap
   memakai placeholder aman (`[alamat rumah]`, `[email]`, `[disensor]`, `[rahasia]`,
   `[tautan]`, `[nama peserta]`, `[data orang tua]`) untuk opsi `good` yang relevan.
6. **Engine & skema tidak disentuh**: `quality` tetap memengaruhi skor (`poor` menurunkan
   verdict satu tingkat + faktor kegunaan 0,55), jadi perubahan murni pada konten.

**Konsekuensi.**

- Test **428 → 431**; `SegmentFeedbackList.test` disesuaikan karena `options[0]` kini `poor`
  (dulu `good`) — kini tes memilih opsi berdasarkan `quality`, bukan indeks.
- Pratinjau kalimat & alur konfirmasi diuji di `ActionPopover.test` (17 test) dan
  `PracticePage.test`.

### Perbaikan setelah uji coba langsung di peramban (bug 14)

Saat dijalankan di peramban (jendela 912 × 670 px), daftar Samarkan menunjukkan dua gejala:

1. **Pratinjau kalimat kedap-kedip dan opsi sulit diklik.** Tinggi isi popover berubah tiap
   kali opsi disorot (kotak pratinjau muncul/hilang, ±107 px). Radix memantau ukuran elemen
   lewat `ResizeObserver` lalu menjalankan ulang `shift`/`flip`, sehingga popover bergeser di
   bawah kursor → kursor kehilangan opsi → pratinjau hilang → tinggi berubah lagi → siklus
   terus berulang.
2. **Sebagian isi keluar layar dan tidak bisa digulir.** Tanpa batas tinggi, popover setinggi
   **772 px** sementara viewport 670 px; karena diposisikan `position: fixed`, menggulir
   halaman tidak menarik bagian yang terpotong kembali ke layar — tombol "Pakai opsi ini" dan
   "Tutup" tidak terjangkau.

**Perbaikan** (`styles/index.css`, `ActionPopover.tsx`, teks baru `action.previewHint`):

- Kelas **`.action-popover`** pada `Popover.Content`:
  `max-height: min(var(--radix-popper-available-height, calc(100vh - 24px)), calc(100vh - 24px))`
  - `overflow-y: auto` + `overscroll-behavior: contain`. Variabel
    `--radix-popper-available-height` dipasang Radix berisi ruang yang tersedia pada sisi
    penempatan, jadi popover **selalu muat di layar** dan sisanya digulir di dalam popover
    (fokus yang masuk otomatis menggulirnya).
- **Kotak pratinjau kini selalu dirender** selama daftar opsi terbuka; sebelum ada opsi
  disorot isiannya `action.previewHint` ("Arahkan ke salah satu opsi untuk melihat hasil
  kalimatnya."). Tinggi badan pratinjau dikunci **3 baris** lewat kelas **`.preview-body`**
  (`height: calc(3 * 1.625em)`, gulir internal bila lebih panjang) sehingga tinggi popover
  **tidak berubah** saat menyorot/memilih → posisi tidak dihitung ulang → tidak ada kedip.
- `ActionPopover.test` disesuaikan: `role="status"` kini selalu ada; tes memastikan isinya
  kembali ke `previewHint` setelah kursor berpindah (jumlah test tetap 17).

**Hasil verifikasi.** Di 360/768/1280 px popover muat penuh (vertikal & horizontal), punya
gulir internal (maks 45/220/244 px), tombol konfirmasi & "Tutup" terjangkau setelah digulir,
tinggi/posisi identik ketiga kali opsi disorot, 0 error konsol. Di 912 × 670 px tinggi terkunci
531 px dan transform `translate(24px, 12px)` konstan pada semua hover; alur pilih opsi →
"Pakai opsi ini" tetap tersimpan sebagai `generalize`.

### Daftar opsi yang ditulis ulang

Urutan **Sebelum** = urutan lama di file (`good · acceptable · poor`); urutan **Sesudah** =
tangga keumuman (`poor → acceptable → good`) yang kini tampil di layar.

#### Skenario 1 — `01-perkenalan-diri.ts`

| Segmen | Sebelum (good · acceptable · poor)                                                                                                       | Sesudah (poor → acceptable → good)                                                                                                                                                           | Alasan                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| s1-01  | `salam pembuka` · `halo` · `halo, namaku Raka Aditya Pratama`                                                                            | `Halo, aku Raka dari SMP Negeri 3 Semarang.` → `Halo, salam kenal dari Semarang.` → `Halo, salam kenal.`                                                                                     | Urutan dibalik; frasa pendek jadi kalimat utuh; `poor` menyebut nama + sekolah            |
| s1-02  | `Raka` · `[namaku]` · `Raka Pratama`                                                                                                     | `Namaku Raka Aditya Pratama, murid kelas 8B.` → `Namaku Raka, murid kelas 8B.` → `Namaku Raka.`                                                                                              | Placeholder `[namaku]` tidak alami di kalimat; `poor` kini nama lengkap + kelas           |
| s1-03  | `[alamat rumah]` · `kota Semarang saja` · `Jl. Kenanga No. 12, Sukamaju`                                                                 | `Aku tinggal di Jl. Kenanga No. 12, Kelurahan Sukamaju, Semarang.` → `Aku tinggal di Kota Semarang.` → `Aku tinggal di [alamat rumah].`                                                      | Semua pakai pola "Aku tinggal di …"; placeholder pindah ke `good`                         |
| s1-04  | `[nomor HP]` · `nomor HP yang bisa dihubungi nanti` · `0812-0000-9999`                                                                   | `Nomor HP-ku 0812-0000-9999 kalau nanti mau dikabari.` → `Nomor HP-ku yang bisa dihubungi nanti lewat kontak sekolah.` → `Nomor HP yang bisa dihubungi nanti.`                               | Sambungan "kalau nanti mau dikabari" membuat kalimat mengalir                             |
| s1-05  | `sebuah SMP di Semarang` · `sekolahku di Semarang` · `SMP Negeri 3 Semarang, kelas 8B`                                                   | `Aku sekolah di SMP Negeri 3 Semarang, kelas 8B, tahun ajaran 2026.` → `Aku sekolah di sebuah SMP di Semarang, kelas 8B.` → `Aku sekolah di sebuah SMP di Jawa Tengah.`                      | Pola "Aku sekolah di …" seragam; `good` dinaikkan ke provinsi agar AI tetap punya konteks |
| s1-06  | `tolong bantu aku berlatih percakapan bahasa Inggris` · `tolong bantu aku berlatih` · `tolong bantu aku, aku siswa kelas 8B di Semarang` | `Tolong bantu aku berlatih percakapan bahasa Inggris, aku siswa kelas 8B di Semarang ya.` → `… untuk tugas sekolah kelas 8B ya.` → `Tolong bantu aku berlatih percakapan bahasa Inggris ya.` | Imbuhan & kata sambung disamakan; `poor` menambah identitas kelas + kota                  |
| s1-07  | `olahraga dan membaca` · `kegiatan santai` · `futsal setiap Jumat di GOR Sukamaju`                                                       | `Hobi aku main futsal setiap Jumat sore di GOR Sukamaju dan baca komik.` → `Hobi aku main futsal setiap sore dan membaca komik.` → `Hobi aku olahraga dan membaca.`                          | Pola "Hobi aku …" seragam; `poor` sebut lokasi + jadwal rutin                             |
| s1-08  | `minta saran kalimat pembuka` · `bagaimana kalimat pembuka yang menarik?` · `pakai namaku Raka untuk membukanya`                         | `Katamu, pakai namaku Raka di kalimat pembukanya, ya?` → `Katamu, apa kalimat pembuka yang asyik untuk murid kelas 8B?` → `Menurutmu, apa kalimat pembuka yang asyik?`                       | Semua jadi pertanyaan utuh (tanda tanya melekat), nyambung dengan segmen sebelumnya       |

#### Skenario 2 — `02-tugas-dan-curhat.ts`

| Segmen | Sebelum (good · acceptable · poor)                                                                                    | Sesudah (poor → acceptable → good)                                                                                                                                                                                       | Alasan                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| s2-01  | `tugas membuat puisi bertema persahabatan` · `tugas sekolah` · `tugas dari Bu Ratna Kusumawati untuk kelas 8B`        | `Aku sedang mengerjakan tugas bahasa Indonesia dari Bu Ratna: membuat puisi bertema persahabatan untuk kelas 8B.` → `… tugas bahasa Indonesia: membuat puisi …` → `… tugas sekolah: membuat puisi bertema persahabatan.` | Pola "Aku sedang mengerjakan …" seragam; nama guru hanya di `poor`                    |
| s2-02  | `seorang sahabat` · `[nama teman]` · `Dimas Aryo`                                                                     | `Ceritanya nanti tentang sahabatku Dimas Aryo, kelas 8B.` → `… sahabatku yang sekelas denganku.` → `… seorang sahabat.`                                                                                                  | Placeholder tidak alami di tengah kalimat; data teman (pihak ketiga) hanya di `poor`  |
| s2-03  | `guruku` · `[nama guru]` · `Bu Ratna, guru Bahasa Indonesia`                                                          | `Bu Ratna, guru Bahasa Indonesia, yang memberi tugas ini.` → `Guru Bahasa Indonesia yang memberi tugas ini.` → `Guruku yang memberi tugas ini.`                                                                          | Sambungan "yang memberi tugas ini" membuat ketiganya nyambung                         |
| s2-04  | `kelas 8` · `sebuah kelas` · `kelas 8B di SMP Negeri 3 Semarang`                                                      | `Aku kelas 8B di SMP Negeri 3 Semarang, tugasnya dikumpulkan minggu depan.` → `Aku kelas 8B, tugasnya … hari Jumat minggu depan.` → `Aku kelas 8, tugasnya … minggu depan.`                                              | `good` tetap menyebut tingkat kelas (dibutuhkan AI), `poor` menambah sekolah + jadwal |
| s2-05  | `[email]` · `email sekolahku` · `nadia.restu08@smp.belajar.id`                                                        | `Email sekolahku nadia.restu08@smp.belajar.id kalau ada balasan.` → `Email sekolahku kalau ada balasan.` → `Email: [email], kalau ada balasan.`                                                                          | Sambungan "kalau ada balasan" seragam; placeholder `[email]` sesuai tips              |
| s2-06  | `tahun kelahiranku 2011` · `usia sekitar 14 tahun` · `17 Maret`                                                       | `Aku lahir 17 Maret 2011 di Semarang, jadi boleh ikut lomba umur SMP.` → `Aku lahir Maret 2011, …` → `Aku lahir tahun 2011, …`                                                                                           | Pola "Aku lahir …" + alasan kelanjutan; tingkat detail turun bertahap                 |
| s2-07  | `aku sedang ada masalah dengan teman` · `aku sedang sedih` · `bertengkar dengan Dimas Aryo Nugroho sejak minggu lalu` | `Aku sedang sedih karena bertengkar dengan sahabatku Dimas Aryo Nugroho sejak minggu lalu.` → `… karena bertengkar dengan sahabatku sejak Senin minggu lalu.` → `… karena ada masalah dengan teman.`                     | Kata sambung "karena" dipasang seragam; nama teman hanya di `poor`                    |
| s2-08  | `aku suka menulis cerita` · `aku suka kegiatan malam` · `menulis cerita tiap malam di kamar sampai jam 11`            | `Aku suka menulis cerita tiap malam di kamar sampai jam 11.` → `Aku suka menulis cerita sebelum tidur, hampir tiap malam.` → `Aku suka menulis cerita di waktu luang.`                                                   | Pola "Aku suka menulis cerita …"; `poor` menyebut kebiasaan terlalu rinci             |
| s2-09  | `cara memaafkan teman` · `saran memperbaiki pertemanan` · `pakai nama Dimas di ceritanya supaya spesifik`             | `Menurutmu, bagaimana cara memaafkan sahabatku Dimas Aryo tanpa membuatnya tersinggung?` → `… teman yang sekelas tanpa …?` → `… teman dengan baik tanpa …?`                                                              | Tanda tanya & sambungan "tanpa membuatnya tersinggung" mengikuti segmen sebelumnya    |

#### Skenario 3 — `03-formulir-dan-percakapan.ts`

| Segmen | Sebelum (good · acceptable · poor)                                                                                | Sesudah (poor → acceptable → good)                                                                                                                                    | Alasan                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| s3-01  | `tolong rapikan formulir ini` · `tolong rapikan` · `tolong isi formulir ini dengan data lengkapku`                | `Tolong isi formulir ini dengan data lengkapku ya:` → `Tolong rapikan formulir ini, isinya data diriku ya:` → `Tolong rapikan formulir ini untuk lomba ya:`           | Koma dua (`:`) pada akhir segmen dipertahankan; ketiganya permintaan utuh            |
| s3-02  | `Nama: [nama peserta]` · `Nama: Rian` · `Nama: Rian Mahendra Putra`                                               | `Nama lengkap: Rian Mahendra Putra.` → `Nama: Rian.` → `Nama: [nama peserta].`                                                                                        | Urutan dibalik; tanda titik format formulir seragam                                  |
| s3-03  | `NIK: [disensor]` · `NIK: 16 digit` · `NIK: 33740512...0004`                                                      | `NIK: 3374051203110004, atas nama Rian Mahendra Putra.` → `NIK: 16 digit tanpa spasi.` → `NIK: [disensor].`                                                           | `poor` kini NIK utuh + pemilik (sangat sensitif); placeholder pindah ke `good`       |
| s3-04  | `NISN: [disensor]` · `NISN: 10 digit` · `NISN: 0071234567`                                                        | `NISN: 0071234567, sekolahku SMP Negeri 3 Semarang.` → `NISN: 10 digit tanpa spasi.` → `NISN: [disensor].`                                                            | Pola sama dengan s3-03; `poor` menambah nama sekolah                                 |
| s3-05  | `kata sandi: [rahasia]` · `kata sandi sudah diisi` · `kata sandi: Bimbel2024!`                                    | `Kata sandi portalnya: bimbel2024!` → `Kata sandi akun portalnya sudah diisi.` → `Kata sandi: [rahasia].`                                                             | Kapitalisasi awal kalimat disesuaikan; placeholder di `good`                         |
| s3-06  | `sebuah gedung di Semarang` · `di kota Semarang` · `Gedung Diponegoro, Jl. Ahmad Yani No. 5`                      | `Lokasi kegiatan: Gedung Diponegoro, Jl. Ahmad Yani No. 5, Semarang.` → `… Gedung Serbaguna Diponegoro, Kota Semarang.` → `… sebuah gedung di Kota Semarang.`         | Prefiks "Lokasi kegiatan:" seragam supaya nyambung dengan segmen sebelumnya          |
| s3-07  | `orang tuaku bekerja di kantoran di Semarang` · `[data orang tua]` · `Budi Santoso, Bank Jateng`                  | `Nama ayahku: Budi Santoso, kerja di Bank Jateng, nomor 0812-0000-5678.` → `Ayahku: bekerja di Bank Jateng.` → `Ayahku: [data orang tua].`                            | Data orang tua (pihak ketiga) hanya di `poor`; format "Ayahku:" seragam              |
| s3-08  | `[tautan dokumen pribadi]` · `tautan folder yang sudah kubagikan` · `drive.google.com/drive/folders/1AbCdEfGhIjK` | `Tautan dokumen: drive.google.com/drive/folders/1AbCdEfGhIjK.` → `Tautan dokumen: folder yang sudah kubagikan.` → `Tautan dokumen: [tautan].`                         | Urutan dibalik; prefiks seragam; placeholder `[tautan]` di `good`                    |
| s3-09  | `aku suka matematika` · `aku suka pelajaran hitungan` · `ikut lomba cerdas cermat kota di Semarang`               | `Aku ikut lomba cerdas cermat mewakili SMP Negeri 3 Semarang karena suka matematika.` → `… tingkat kota karena suka matematika.` → `… karena suka matematika.`        | Pola "Aku ikut lomba … karena suka matematika" seragam; nama sekolah hanya di `poor` |
| s3-10  | `batas pendaftarannya minggu ini` · `hari Jumat` · `Jumat 3 Oktober pukul 15.00 di Gedung Diponegoro`             | `Batas pendaftarannya Jumat 3 Oktober pukul 15.00 di Gedung Diponegoro.` → `… hari Jumat sore pukul 15.00.` → `… minggu ini sore hari.`                               | Prefiks "Batas pendaftarannya" seragam; detail waktu+lokasi turun bertahap           |
| s3-11  | `balas dengan tabel` · `balas dengan rapi` · `balas lengkap dengan NIK dan NISN-ku`                               | `Tolong balas dalam tabel, sekalian dengan NIK dan NISN-ku ya.` → `Tolong balas dalam bentuk tabel yang rapi dan lengkap ya.` → `Tolong balas dalam bentuk tabel ya.` | Permintaan utuh dengan akhiran "ya"; `poor` meminta AI mengulang data sensitif       |

---

## Ringkasan

| ADR | Judul                                        | Status             |
| --- | -------------------------------------------- | ------------------ |
| 001 | `options` di level `Segment`                 | diterima (deviasi) |
| 002 | `HashRouter`                                 | diterima           |
| 003 | Playwright/e2e ditunda                       | ditunda            |
| 004 | Framer Motion/Tooltip/@fontsource ditunda    | diterima           |
| 005 | Penalti hint 5 poin                          | diterima           |
| 006 | `feedback: ''` → teks generik                | diterima           |
| 007 | Segmen baris penuh, bukan chip               | diterima           |
| 008 | Animasi dialog tanpa `transform`             | diterima (bugfix)  |
| 009 | Tanpa PWA/IndexedDB/Husky                    | diterima           |
| 010 | Struktur laporan pengujian                   | diterima           |
| 011 | Beranda impor eager demi CLS                 | diterima (deviasi) |
| 012 | Penyederhanaan UI untuk siswa SMP            | diterima           |
| 013 | Ukuran font terpusat ke variabel CSS         | diterima           |
| 014 | Alur "Samarkan": pratinjau + tangga keumuman | diterima           |

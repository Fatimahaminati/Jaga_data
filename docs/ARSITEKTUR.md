# Arsitektur Aplikasi

Ringkasan dari dokumen spesifikasi `arsitektur-web-latihan-pdp-ai.md` sesuai implementasi aktual.

## 1. Keputusan kunci

| Aspek          | Pilihan                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| Jenis aplikasi | **Static SPA, client-only** — tanpa backend, API AI, autentikasi, atau analytics |
| Framework      | React 18 + TypeScript **strict** + Vite                                          |
| Routing        | React Router v6 dengan **`HashRouter`** (lihat `docs/DECISIONS.md`)              |
| State          | Zustand + middleware `persist` (envelope divalidasi Zod)                         |
| Styling        | Tailwind CSS + komponen headless Radix UI (Dialog, Popover, Tabs)                |
| Validasi       | Zod — skenario dan data tersimpan                                                |
| Ekspor         | jsPDF (dynamic import), html-to-image (dynamic import), JSON, CSV                |
| Bahasa         | Kamus string terpusat `content/strings/id.ts`                                    |

## 2. Lapisan & aturan dependensi

```
┌───────────────────────────────────────────────────────────────┐
│ Presentation   pages/  features/  components/                │
├───────────────────────────────────────────────────────────────┤
│ Application    stores/ (Zustand)   hooks/                    │
├───────────────────────────────────────────────────────────────┤
│ Domain         domain/   ← PURE TS, tanpa React/DOM/localStorage │
├───────────────────────────────────────────────────────────────┤
│ Infrastructure infra/   ← StorageRepository, exporter        │
└───────────────────────────────────────────────────────────────┘

content/  (data statis: skenario, strings, tips) → dikonsumsi oleh semua lapisan
```

**Panah hanya ke bawah.** `domain/` tidak boleh mengimpor `react`, `zustand`,
`window`, atau `localStorage` — inilah yang membuat mesin penilaian mudah diuji dan diaudit.

## 3. Peta berkas

| Lapisan   | Berkas                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain    | `types.ts`, `scoring/{config,rules,engine}.ts`, `preview/buildPreview.ts`, `schemas/{scenario,storage}.schema.ts`                                            |
| Content   | `content/scenarios/*.ts`, `content/strings/id.ts`, `content/tips.ts`                                                                                         |
| Infra     | `infra/storage/{StorageRepository,localStorageRepo,migrations,repoPersistStorage}.ts`, `infra/export/{download,exportJson,exportCsv,exportPdf,exportPng}.ts` |
| Stores    | `stores/{sessionStore,progressStore,settingsStore}.ts`                                                                                                       |
| Hooks     | `hooks/{useAutosaveDraft,useReducedMotion}.ts`                                                                                                               |
| Fitur     | `features/{scenarios,editor,feedback,history,export}/`                                                                                                       |
| Halaman   | `pages/{Home,Scenarios,Practice,Result,History,Guide,NotFound}Page.tsx`                                                                                      |
| Perakitan | `main.tsx` → `App.tsx` (preferensi tampilan + ErrorBoundary) → `routes.tsx`                                                                                  |

## 4. Alur data

```
Skenario statis (validasi Zod saat load)
   → TokenEditor (keputusan per segmen, undo/redo, autosave draft)
   → sessionStore
   → score(scenario, decisions, { hintUsed })        ← domain/, murni & deterministik
   → ScoreResult (skor privasi, kegunaan, badge, per-segmen)
   → ResultPage (pratinjau sebelum/sesudah + umpan balik)
   → progressStore (localStorage) & ExportMenu (PDF/PNG/JSON/CSV)
   → HistoryPage (statistik, grafik SVG, tabel)
```

**Tidak ada panah yang keluar dari perangkat pengguna.**

## 5. Model penilaian

```
privacyScore  = Σ (bobotLevel × poinVerdict) / Σ bobotLevel  − penalti
utilityScore  = Σ nilaiKegunaan(segmen, aksi) / jumlahSegmen
total         = 0.7 × privacy + 0.3 × utility − 5 (bila hint dipakai)
badge         = <50 pemula · 50–79 waspada · ≥80 penjaga data
```

- **bobotLevel:** `high 1.5 · medium 1 · low 0.6 · safe 0`
- **poinVerdict:** `correct 1 · partial 0.5 · wrong 0`
- **penalti:** `+0.5` untuk setiap segmen `high` yang justru dipertahankan
- **kualitas opsi generalisasi `poor`** menurunkan verdict satu tingkat

Konstanta ada di `domain/scoring/config.ts`. `score()` deterministik: input sama → hasil sama.

### Segmen non-sensitif

`keep` = tepat · `remove` = keliru · `generalize` = cukup baik.
`feedback: ''` → UI memakai teks generik dari `strings.result.neutralFeedback[verdict]`.

## 6. Penyimpanan lokal

| Kunci                    | Isi                                             | Skema                    |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| `pdp:progress`           | Daftar `Attempt` (maks. 200)                    | `progressEnvelopeSchema` |
| `pdp:settings`           | nama panggilan, ukuran font, kontras, izin hint | `settingsEnvelopeSchema` |
| `pdp:draft:{scenarioId}` | Draf keputusan per skenario                     | `draftEnvelopeSchema`    |

Semua akses melalui **`StorageRepository`** (`localStorageRepo`) dengan:

- prefiks `pdp:` dan `schemaVersion`;
- validasi **Zod saat dibaca** — data rusak di-reset dengan aman, aplikasi tidak crash;
- `try/catch` untuk `QuotaExceededError` dan mode privat → fallback ke penyimpanan memori;
- `migrate()` dari `infra/storage/migrations.ts` bila versi skema berubah.

## 7. Ekspor

| Format | Berkas                                         | Muat                             |
| ------ | ---------------------------------------------- | -------------------------------- |
| JSON   | `exportJson.ts`                                | langsung                         |
| CSV    | `exportCsv.ts` (dengan BOM agar rapi di Excel) | langsung                         |
| PDF    | `exportPdf.ts` → `PdfDocumentSpec`             | **dynamic import** jsPDF         |
| PNG    | `exportPng.ts` → node DOM                      | **dynamic import** html-to-image |

Karena dynamic import, `jspdf` (± 118 KB gzip) dan `html2canvas` (± 48 KB gzip) **tidak masuk
bundle awal**.

## 8. Aksesibilitas

- `AppShell` menyediakan _skip link_ dan `<main tabIndex={-1}>`.
- Semua interaksi dapat dijalankan papan ketik (Tab/Enter/Space/Esc) lewat primitive Radix.
- Target sentuh ≥ 44 px; token segmen dirender sebagai baris penuh, bukan chip inline.
- `aria-live` pada pratinjau dan status ekspor; `role="status"` pada pesan konfirmasi.
- Mode kontras tinggi (`[data-contrast='high']`) dan tiga ukuran teks. Ukuran font dipusatkan
  ke variabel `--fs-*` di `styles/index.css`; opsi Pengaturan hanya mengubah atribut
  `data-font-scale` (`normal` / `large` ×1,1 / `xlarge` ×1,2) yang mengalikan variabel ts,
  `<html>` tidak pernah diubah ukurannya (ADR-013).
- `prefers-reduced-motion` dihormati lewat CSS global dan `useReducedMotion`.

## 9. Keamanan & privasi

Berkas `_headers` berisi:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; font-src 'self'; connect-src 'self';
  object-src 'none'; base-uri 'self'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

Verifikasi: `performance.getEntriesByType('resource')` tidak menunjukkan satu pun request
ke domain luar.

## 10. Pengujian

| Jenis             | Berkas                                                         |
| ----------------- | -------------------------------------------------------------- |
| Unit engine       | `domain/scoring/engine.test.ts`                                |
| Unit pratinjau    | `domain/preview/buildPreview.test.ts`                          |
| Validasi skenario | `domain/schemas/scenario.schema.test.ts`                       |
| Storage           | `infra/storage/localStorageRepo.test.ts`, `migrations.test.ts` |
| Ekspor            | `infra/export/export.test.ts`                                  |

```bash
pnpm test
```

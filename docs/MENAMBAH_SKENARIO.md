# Menambah Skenario Baru

Skenario adalah **data**, bukan komponen. Menambah skenario tidak menyentuh kode UI.

## 1. Buat berkas baru

Buat `src/content/scenarios/04-nama-berkas.ts`:

```ts
import type { Scenario } from '@/domain/types'

/** Skenario 4 — Semua nama, alamat, dan nomor di bawah adalah DATA FIKTIF. */
export const scenario4: Scenario = {
  id: 'media-sosial', // unik, dipakai di URL & localStorage
  title: 'Mengunggah caption ke AI',
  difficulty: 2, // 1 = mudah, 2 = sedang, 3 = sulit
  context: 'Situasi cerita (data fiktif).',
  aiTaskGoal: 'Apa yang benar-benar dibutuhkan AI agar bisa membantu.',
  learningObjectives: ['…'],
  segments: [/* … */],
}
```

## 2. Daftarkan di `src/content/scenarios/index.ts`

```ts
import { scenario4 } from './04-nama-berkas'

const rawScenarios: Scenario[] = [scenario1, scenario2, scenario3, scenario4]
```

Saat aplikasi dimuat, daftar ini divalidasi Zod (`scenarioSchema`). Bila ada yang tidak lolos,
aplikasi berhenti dengan pesan yang jelas — itu **kesalahan konten**, bukan kesalahan pengguna.

## 3. Struktur segmen

Setiap segmen **wajib** punya `options` (dipakai popover "Samarkan"), dan **opsional**
punya blok `sensitive`:

```ts
{
  id: 's4-03',
  text: 'Nama akun-ku @raka_pratama12.',
  // Urutan array = tangga keumuman: paling spesifik dulu, paling umum terakhir.
  options: [
    { id: 's4-03-o1', label: '@raka_pratama12', quality: 'poor' },  // masih terlalu jelas
    { id: 's4-03-o2', label: 'akun pribadi',    quality: 'acceptable' },
    { id: 's4-03-o3', label: '[nama akun]',     quality: 'good' },  // aman
  ],
  sensitive: {
    category: 'nama',                 // lihat daftar di bawah
    level: 'medium',                  // high | medium | low | safe
    rule: { best: ['generalize'], acceptable: ['remove'] },
    feedback: {
      correct: '…',                   // aksi ideal
      partial: '…',                   // aksi cukup baik
      wrong: '…',                     // harus menjelaskan MENGAPA berisiko
      tip: '…',                       // tips praktis, kalimat pendek
    },
  },
}
```

### Aturan penulasan

- `id` segmen harus unik **di seluruh skenario** dan berformat pola `s4-03`.
- Tiap segmen punya **3–4 opsi**, disusun dari **paling spesifik ke paling umum**
  (`poor` → `acceptable` → `good`). Urutan ini yang ditampilkan di layar (tangga keumuman).
- `options` wajib punya minimal satu `good` dan **satu `poor`** (validasi Zod), plus satu
  `acceptable` yang sangat disarankan — pilihan `poor` menurunkan verdict satu tingkat,
  inilah yang mengajarkan generalisasi yang benar.
- `label` harus **pas secara tata bahasa** dengan kalimat sekitarnya. Layar menyusun
  pratinjau sebagai `<segmen sebelum> + ' ' + label + ' ' + <segmen sesudah>` (satu spasi,
  tanpa tanda baca tambahan), jadi perhatikan kata sambung, imbuhan, kata depan, huruf
  kapital di awal kalimat, dan tanda baca yang melekat pada segmen.
- Penanda kualitas (`Masih terlalu jelas` / `Cukup aman` / `Aman`) hanya muncul **setelah**
  siswa memilih, sehingga pilihan awal siswa tidak dibocorkan oleh tampilan.
- `rule.best` = aksi ideal (verdict `correct`), `rule.acceptable` = cukup baik (50%),
  sisanya `wrong`.
- Segmen **pengecoh** (bukan data pribadi) tetap diberi `options`, dengan `level: 'safe'`
  dan `rule: { best: ['keep'], acceptable: ['generalize'] }` — menghapusnya menurunkan
  skor kegunaan.
- Umpan balik: kalimat pendek, contoh konkret, bahasa siswa SMP, tidak menggurui.

### `category` yang tersedia

`nama` · `alamat` · `telepon` · `email` · `sekolah` · `tanggal_lahir` · `identitas` ·
`kredensial` · `foto_lokasi` · `keluarga_teman` · `umum`

Label kategori ada di `strings.feedback.category` (`content/strings/id.ts`).

### Panduan `level`

| Level    | Contoh                                  | Bobot skor                 | Ideal                   |
| -------- | --------------------------------------- | -------------------------- | ----------------------- |
| `high`   | alamat lengkap, no. HP, NIK, kata sandi | 1.5                        | `remove` / `generalize` |
| `medium` | nama sekolah, tanggal lahir             | 1                          | `generalize`            |
| `low`    | hobi umum                               | 0.6                        | `keep`                  |
| `safe`   | pengecoh netral                         | 0 (tidak dihitung privasi) | `keep`                  |

> Segmen `high` yang dipertahankan kena penalti +0.5.

## 4. Data wajib fiktif

Gunakan pola yang jelas: `0812-0000-xxxx`, nama tokoh rekaan, alamat rekaan.
**Jangan pernah** memakai data pribadi asli dalam konten, contoh, maupun test.

## 5. Periksa

```bash
pnpm typecheck
pnpm test        # memuat & memvalidasi seluruh skenario
pnpm lint
```

`domain/schemas/scenario.schema.test.ts` memvalidasi semua skenario terhadap skema Zod
dan memastikan tidak ada `id` ganda.

## 6. Checklist kualitas

- [ ] ≥ 4 segmen sensitif
- [ ] ≥ 1 pengecoh aman (skenario sedang & sulit)
- [ ] Setiap segmen punya 3–4 opsi generalisasi, urut spesifik → umum, termasuk satu
      `poor` dan satu `good`
- [ ] Setiap `label` opsi nyambung dengan kalimat sekitarnya (uji: gabung segmen sebelum,
      label, dan segmen sesudah dengan satu spasi)
- [ ] `wrong` menjelaskan alasan risiko, bukan sekadar "ini salah"
- [ ] Seluruh data fiktif dan konsisten dengan `aiTaskGoal`
- [ ] Lulus `pnpm typecheck && pnpm test && pnpm lint`

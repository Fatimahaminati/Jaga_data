# Instalasi & Menjalankan

## Prasyarat

| Komponen | Versi      | Cek       |
| -------- | ---------- | --------- |
| Node.js  | LTS (≥ 20) | `node -v` |
| pnpm     | ≥ 9        | `pnpm -v` |

Jika `pnpm` belum tersedia, aktifkan lewat corepack (datang bersama Node.js):

```bash
corepack enable          # bila gagal (hak akses), pakai: corepack pnpm <perintah>
corepack prepare pnpm@latest --activate
```

## 1. Instalasi dependensi

```bash
cd pdp-ai-literacy
pnpm install
```

> Konfigurasi `pnpm-workspace.yaml` memuat `allowBuilds` untuk `esbuild`
> (diperlukan Vite) dan menonaktifkan `core-js` agar tidak ada skrip pihak ketiga
> yang ikut terpasang.

## 2. Mode pengembangan

```bash
pnpm dev
```

Buka <http://localhost:5173>. Server memuat ulang otomatis saat berkas diubah.

## 3. Pemeriksaan kualitas

Jalankan semuanya sebelum commit (CI juga menjalankan urutan yang sama):

```bash
pnpm lint        # ESLint (typescript-eslint + jsx-a11y)
pnpm typecheck   # tsc --noEmit (strict)
pnpm test        # Vitest — unit test domain, storage, ekspor
pnpm format:check# Prettier
```

## 4. Build produksi

```bash
pnpm build       # tsc --noEmit && vite build → dist/
pnpm preview     # sajikan dist/ di http://localhost:4173
```

Keluaran `dist/` sepenuhnya statis: HTML, CSS, JS, dan SVG.

## 5. Deploy

Karena aplikasi ini client-only, **hosting statis apa pun** bisa dipakai.

### Cloudflare Pages / Netlify

| Pengaturan       | Nilai             |
| ---------------- | ----------------- |
| Root directory   | `pdp-ai-literacy` |
| Build command    | `pnpm build`      |
| Output directory | `dist`            |

Berkas `_headers` di root sudah memuat header keamanan
(`Content-Security-Policy`, `Referrer-Policy: no-referrer`,
`X-Content-Type-Options: nosniff`) dan otomatis dibaca kedua platform tersebut.

### GitHub Pages

Aplikasi memakai **`HashRouter`**, sehingga tidak ada konfigurasi rewrite/404
khusus yang diperlukan — cukup unggah isi `dist/`.

## 6. Verifikasi pasca-deploy (smoke test)

1. Buka URL produksi, pastikan Beranda tampil.
2. Buka tab **Network**: tidak boleh ada request ke domain selain domain aplikasi.
3. Selesaikan satu skenario → pastikan hasil muncul dan tersimpan setelah reload.
4. Uji **Panduan → Pengaturan → Hapus semua data lokal**.

## Masalah umum

| Gejala                         | Penyebab                              | Solusi                                                |
| ------------------------------ | ------------------------------------- | ----------------------------------------------------- |
| `EPERM` saat `corepack enable` | Folder instalasi Node butuh hak admin | Pakai `corepack pnpm <perintah>` langsung             |
| Riwayat tidak tersimpan        | Mode privat / localStorage diblokir   | Aplikasi tetap jalan; muncul peringatan di Pengaturan |
| Port 5173 terpakai             | Server dev lama masih berjalan        | `pnpm dev -- --port 5180`                             |

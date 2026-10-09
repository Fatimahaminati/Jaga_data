# Laporan Pengujian Usability

**Proyek:** Pengembangan Media Web Interaktif untuk Pembelajaran Perlindungan Data Pribadi saat
Menggunakan AI pada Siswa SMP (`pdp-ai-literacy`)
**Status:** Instrumen selesai, sesi partisipan **belum dijalankan** — bagian hasil diisi setelah
sesi berlangsung (Tahap 8.2–8.5).

---

## 1. Tujuan

1. Mengukur kemudahan pemakaian aplikasi bagi siswa SMP melalui **System Usability Scale (SUS)**.
2. Mengukur tingkat keberhasilan tugas, waktu penyelesaian, dan jumlah kesalahan.
3. Mengukur perubahan pemahaman konsep perlindungan data pribadi saat memakai AI (kuis pra/pasca).
4. Mengidentifikasi masalah usability, memprioritaskannya (kritis / mayor / minor), lalu
   memperbaiki yang kritis dan mayor.

---

## 2. Metode

| Item              | Rencana                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Desain            | Studi kualitatif-kuantitatif satu sesi, observasional, _think-aloud_                                             |
| Partisipan        | 5–8 siswa SMP (izin sekolah/orang tua) + 1–2 guru                                                                |
| Tugas             | T1 skenario mudah · T2 petunjuk & umpan balik · T3 ekspor & riwayat · T4 (guru)                                  |
| Instrumen         | `instrumen/skenario-uji-usability.md`, `instrumen/lembar-observasi.md`, `instrumen/kuesioner-sus.md`             |
| Pengukuran        | Keberhasilan tugas, waktu (detik), jumlah kesalahan, tingkat bantuan (—/H1/H2/H3), skor SUS, skor kuis pra/pasca |
| Analisis SUS      | (jumlah konversi 10 butir) × 2,5; ambang ≥ 68                                                                    |
| Prioritas masalah | kritis (tugas gagal) · mayor (butuh bantuan berulang) · minor (gangguan kecil)                                   |

---

## 3. Hasil kuantitatif

> **Belum diisi** — tabel di bawah diisi per peserta setelah sesi.

### 3.1 Ringkasan per peserta

| Peserta | Peran | T1 selesai / waktu (dtk) | T2 selesai / waktu | T3 selesai / waktu | Kesalahan total | Bantuan tertinggi | Skor SUS | Kuis pra → pasca |
| ------- | ----- | ------------------------ | ------------------ | ------------------ | --------------- | ----------------- | -------- | ---------------- |
| P1      |       |                          |                    |                    |                 |                   |          |                  |
| P2      |       |                          |                    |                    |                 |                   |          |                  |
| P3      |       |                          |                    |                    |                 |                   |          |                  |
| P4      |       |                          |                    |                    |                 |                   |          |                  |
| P5      |       |                          |                    |                    |                 |                   |          |                  |
| P6      |       |                          |                    |                    |                 |                   |          |                  |
| P7      |       |                          |                    |                    |                 |                   |          |                  |
| P8      |       |                          |                    |                    |                 |                   |          |                  |

### 3.2 Agregat

| Metrik                                   | Nilai                 |
| ---------------------------------------- | --------------------- |
| Tingkat keberhasilan T1 / T2 / T3        | … % / … % / … %       |
| Rata-rata waktu T1 / T2 / T3             | … dtk / … dtk / … dtk |
| Rata-rata jumlah kesalahan               | …                     |
| **Skor SUS rata-rata (rentang 0–100)**   | **…** (ambang: ≥ 68)  |
| Skor SUS terendah – tertinggi            | … – …                 |
| Kuis konsep: rata-rata pra → pasca (0–5) | … → …                 |

**Status DoD Tahap 8:**

- [ ] Skor SUS rata-rata ≥ 68, **atau** rencana perbaikan terdokumentasi (bagian 6).
- [ ] Semua masalah kritis tertutup.

---

## 4. Hasil kualitatif

> **Belum diisi** — rangkum dari `lembar-observasi.md`.

### 4.1 Temuan masalah

| ID   | Tugas | Deskripsi | Severity | Status |
| ---- | ----- | --------- | -------- | ------ |
| M-01 |       |           |          |        |
| M-02 |       |           |          |        |

### 4.2 Kutipan representatif peserta

- _(belum ada data)_

### 4.3 Umpan balik atas pertanyaan terbuka

- _(belum ada data)_

---

## 5. Temuan dari audit otomatis & perbaikan yang sudah dilakukan

Bagian ini berisi masalah usability/aksesibilitas yang terdeteksi **tanpa partisipan** (audit
Lighthouse, smoke test, dan pemeriksaan manual) beserta status perbaikannya. Semua sudah lulus
verifikasi ulang (lihat `LAPORAN_PENGUJIAN_FUNGSI.md` bagian 7).

| Temuan                                                                                                        | Sumber                      | Severity      | Perbaikan                                                                                   | Status                          |
| ------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| Tombol & tautan nav ikon-only tanpa nama aksesibel pada layar sempit (tertutup label teks `hidden md:inline`) | Lighthouse, viewport 412 px | Kritis (a11y) | `aria-label` pada logo, 4 tautan nav, dan tombol Pengaturan                                 | ✅ Ditutup — Accessibility 1,00 |
| Teks kecil `text-ink-500` berkontras 4,46 (< 4,5) di atas `bg-ink-50`                                         | Lighthouse `color-contrast` | Mayor         | `ink.500` → `#5f6c85` (kontras 4,94)                                                        | ✅ Ditutup                      |
| 5 pemakaian `text-ink-400`/`fill-ink-400` (kontras 2,96) untuk teks & label grafik                            | Pemeriksaan manual          | Mayor         | Dialihkan ke `ink-500`                                                                      | ✅ Ditutup                      |
| Dialog Pengaturan tidak terpusat — kontrol di tepi layar, sulit dijangkau sentuh                              | Smoke test                  | Kritis        | Animasi tidak memakai `transform` (ADR-008)                                                 | ✅ Ditutup                      |
| Geser tata letak (CLS 0,235) saat halaman beranda dimuat                                                      | Lighthouse Edge             | Mayor         | Beranda diimpor eager (ADR-011) → CLS 0                                                     | ✅ Ditutup                      |
| Teks UI berukuran kecil pada mode kecil                                                                       | Pemeriksaan manual          | Minor         | Ukuran teks Normal / Besar (×1,1) / Sangat besar (×1,2) + mode kontras tinggi di Pengaturan | ✅ Tersedia                     |

---

## 6. Rencana perbaikan (pengungkit DoD bila SUS < 68)

Rencana ini berlaku ganda: (a) sebagai tindak lanjut bila hasil SUS partisipan belum mencapai 68,
dan (b) sebagai daftar perbaikan kualitas pemakaian yang berkelanjutan.

1. **Panduan singkat di halaman latihan** — tambahkan langkah bernomor 1–3 yang selalu terlihat
   agar peserta baru tidak perlu membaca seluruh Panduan (menangani temuan "bingung harus mulai
   dari mana").
2. **Umpan balik skor yang lebih eksplisit** — tampilkan penjelasan satu kalimat di bawah
   angka skor (privasi = X/100, kegunaan = Y/100, pengurangan petunjuk = −5) langsung di
   `ResultPage` (menangani temuan "arti skor kurang jelas").
3. **Ikon + label pada tombol aksi** di bawah 768 px agar label tidak tersembunyi sama sekali
   (pengalaman dari temuan `aria-label` pada audit mobile).
4. **Penambahan jumlah contoh skenario** (4–6) untuk memperpanjang pemakaian di kelas, sesuai
   panduan di `docs/MENAMBAH_SKENARIO.md`.
5. **Uji ulang SUS** setelah perbaikan 1–3, target SUS ≥ 68 dan keberhasilan T1–T3 ≥ 80%.

---

## 7. Jadwal pelaksanaan

| Tahap | Kegiatan                                               | Status      |
| ----- | ------------------------------------------------------ | ----------- |
| 1     | Penyusunan instrumen (3 berkas di `instrumen/`)        | ✅ Selesai  |
| 2     | Permohonan izin sekolah/orang tua & penjadwalan        | ⬜ Menunggu |
| 3     | Sesi bersama 5–8 siswa + 1–2 guru (_think-aloud_)      | ⬜ Menunggu |
| 4     | Skoring SUS, tabulasi waktu/kesalahan, analisis temuan | ⬜ Menunggu |
| 5     | Perbaikan masalah kritis & mayor, uji ulang            | ⬜ Menunggu |
| 6     | Pengisian laporan ini & penutupan DoD                  | ⬜ Menunggu |

---

## 8. Lampiran

- `instrumen/skenario-uji-usability.md` — tugas & kriteria keberhasilan.
- `instrumen/lembar-observasi.md` — lembar isian per peserta.
- `instrumen/kuesioner-sus.md` — 10 butir SUS + pertanyaan terbuka + cara skoring.
- `LAPORAN_PENGUJIAN_FUNGSI.md` — hasil pengujian fungsi, cakupan test, dan Lighthouse.

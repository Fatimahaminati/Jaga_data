import type { Scenario } from '@/domain/types'

/**
 * Skenario 3 — Sulit.
 * Tempelan formulir pendaftaran lomba berisi identitas resmi, kredensial,
 * tautan pribadi, dan data orang tua. Semua DATA FIKTIF.
 */
export const scenario3: Scenario = {
  id: 'formulir-dan-percakapan',
  title: 'Menyalin formulir / percakapan ke AI',
  difficulty: 3,
  context:
    'Kamu menempelkan formulir pendaftaran lomba ke AI supaya otomatis dirapikan. Di dalamnya ada NIK, NISN, kata sandi, tautan dokumen, dan data orang tua.',
  aiTaskGoal:
    'AI hanya perlu tahu ini formulir lomba cerdas cermat, bagian mana yang harus dirapikan, dan batas waktunya. Identitas resmi dan kata sandi TIDAK boleh ikut.',
  learningObjectives: [
    'Mengenali identitas resmi (NIK, NISN) dan kredensial (kata sandi, tautan dokumen).',
    'Menyadari risiko gabungan: beberapa data aman sendiri bisa jadi berbahaya bila digabung.',
    'Menjaga data orang tua yang ikut tersalin tanpa sengaja.',
  ],
  segments: [
    {
      id: 's3-01',
      text: 'Tolong rapikan formulir ini ya:',
      options: [
        {
          id: 's3-01-o1',
          label: 'Tolong isi formulir ini dengan data lengkapku ya:',
          quality: 'poor',
        },
        {
          id: 's3-01-o2',
          label: 'Tolong rapikan formulir ini, isinya data diriku ya:',
          quality: 'acceptable',
        },
        { id: 's3-01-o3', label: 'Tolong rapikan formulir ini untuk lomba ya:', quality: 'good' },
      ],
    },
    {
      id: 's3-02',
      text: 'Nama: Rian Mahendra Putra.',
      options: [
        { id: 's3-02-o1', label: 'Nama lengkap: Rian Mahendra Putra.', quality: 'poor' },
        { id: 's3-02-o2', label: 'Nama: Rian.', quality: 'acceptable' },
        { id: 's3-02-o3', label: 'Nama: [nama peserta].', quality: 'good' },
      ],
      sensitive: {
        category: 'nama',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct:
            'Tepat! Formulir tetap terbaca urutannya, tapi identitas lengkapmu tidak ikut terkirim.',
          partial: 'Aman. Nama panggilan jauh lebih sulit dipakai untuk melacakmu.',
          wrong:
            'Nama lengkap pada formulir sering digabungkan dengan NIK dan sekolah. Begitu digabung, datamu sulit disembunyikan lagi.',
          tip: 'Bentuk "[nama peserta]" sudah cukup supaya AI tahu ini kolom nama.',
        },
      },
    },
    {
      id: 's3-03',
      text: 'NIK: 3374051203110004.',
      options: [
        {
          id: 's3-03-o1',
          label: 'NIK: 3374051203110004, atas nama Rian Mahendra Putra.',
          quality: 'poor',
        },
        { id: 's3-03-o2', label: 'NIK: 16 digit tanpa spasi.', quality: 'acceptable' },
        { id: 's3-03-o3', label: 'NIK: [disensor].', quality: 'good' },
      ],
      sensitive: {
        category: 'identitas',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Sempurna! NIK adalah data paling sensitif: bisa dipakai membuat akun pinjaman online atas namamu. AI tidak membutuhkannya sama sekali.',
          partial: 'Aman. Cukup menyebut bahwa ada kolom NIK tanpa angkanya.',
          wrong:
            'NIK 16 digit adalah identitas resmi negara. Data ini dipakai untuk membuat kartu, pinjaman, dan layanan atas namamu tanpa sepengetahuanmu.',
          tip: 'Angka 16 digit tanpa spasi hampir selalu NIK. Sensor habis.',
        },
      },
    },
    {
      id: 's3-04',
      text: 'NISN: 0071234567.',
      options: [
        {
          id: 's3-04-o1',
          label: 'NISN: 0071234567, sekolahku SMP Negeri 3 Semarang.',
          quality: 'poor',
        },
        { id: 's3-04-o2', label: 'NISN: 10 digit tanpa spasi.', quality: 'acceptable' },
        { id: 's3-04-o3', label: 'NISN: [disensor].', quality: 'good' },
      ],
      sensitive: {
        category: 'identitas',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Benar! NISN bisa dipakai untuk mengecek data dirimu di layanan pendidikan. Tidak ada gunanya untuk AI.',
          partial: 'Aman, angka aslinya tidak terkirim.',
          wrong:
            'NISN dipakai menelusuri rapor, pendaftaran, dan data sekolahmu. Cukup sebut bahwa ada kolom NISN, tanpa angkanya.',
          tip: 'Identitas resmi selalu diberi tanda [disensor] atau dihapus total.',
        },
      },
    },
    {
      id: 's3-05',
      text: 'Kata sandi akun portalnya: bimbel2024!',
      options: [
        { id: 's3-05-o1', label: 'Kata sandi portalnya: bimbel2024!', quality: 'poor' },
        { id: 's3-05-o2', label: 'Kata sandi akun portalnya sudah diisi.', quality: 'acceptable' },
        { id: 's3-05-o3', label: 'Kata sandi: [rahasia].', quality: 'good' },
      ],
      sensitive: {
        category: 'kredensial',
        level: 'high',
        rule: { best: ['remove'], acceptable: ['generalize'] },
        feedback: {
          correct:
            'Hebat! Kata sandi tidak boleh dibagikan ke siapa pun — termasuk AI. Cukup tulis bahwa kolomnya sudah diisi.',
          partial: 'Aman, kata sandimu tidak ikut terkirim.',
          wrong:
            'Kata sandi berarti kunci akunmu. Sekali dibagikan, akunmu bisa dibuka orang lain, dan bisa dipakai juga di situs lain kalau sandimu sama.',
          tip: 'Aturan paling sederhana: kata sandi tidak pernah diketik ke chat mana pun.',
        },
      },
    },
    {
      id: 's3-06',
      text: 'Lokasi kegiatan: Gedung Serbaguna Diponegoro, Jl. Ahmad Yani No. 5, Semarang.',
      options: [
        {
          id: 's3-06-o1',
          label: 'Lokasi kegiatan: Gedung Diponegoro, Jl. Ahmad Yani No. 5, Semarang.',
          quality: 'poor',
        },
        {
          id: 's3-06-o2',
          label: 'Lokasi kegiatan: Gedung Serbaguna Diponegoro, Kota Semarang.',
          quality: 'acceptable',
        },
        {
          id: 's3-06-o3',
          label: 'Lokasi kegiatan: sebuah gedung di Kota Semarang.',
          quality: 'good',
        },
      ],
      sensitive: {
        category: 'alamat',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct: 'Tepat! AI cukup tahu kotanya untuk membantu, tanpa alamat lengkap gedungnya.',
          partial: 'Cukup baik. Yang penting alamat lengkapnya tidak terkirim.',
          wrong:
            'Alamat kegiatan bukan rahasia, tapi alamat lengkap bisa digabung dengan jadwalmu. Kota saja sudah cukup untuk AI.',
          tip: 'Umumkan ke tingkat kota, bukan jalan dan nomor bangunan.',
        },
      },
    },
    {
      id: 's3-07',
      text: 'Ayahku: Budi Santoso, bekerja di Bank Jateng, nomor 0812-0000-5678.',
      options: [
        {
          id: 's3-07-o1',
          label: 'Nama ayahku: Budi Santoso, kerja di Bank Jateng, nomor 0812-0000-5678.',
          quality: 'poor',
        },
        { id: 's3-07-o2', label: 'Ayahku: bekerja di Bank Jateng.', quality: 'acceptable' },
        { id: 's3-07-o3', label: 'Ayahku: [data orang tua].', quality: 'good' },
      ],
      sensitive: {
        category: 'keluarga_teman',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Sempurna! Data orang tua ikut tersalin tanpa mereka tahu. Cukup informasi umum yang AI butuhkan.',
          partial: 'Aman. Nama dan nomor ayahmu tidak jadi terkirim.',
          wrong:
            'Ini data orang lain. Nama, tempat kerja, dan nomor telepon memudahkan orang menghubungi keluargamu.',
          tip: 'Kalau ada kolom orang tua, ganti dengan [data orang tua].',
        },
      },
    },
    {
      id: 's3-08',
      text: 'Tautan dokumen: https://drive.google.com/drive/folders/1AbCdEfGhIjK',
      options: [
        {
          id: 's3-08-o1',
          label: 'Tautan dokumen: drive.google.com/drive/folders/1AbCdEfGhIjK.',
          quality: 'poor',
        },
        {
          id: 's3-08-o2',
          label: 'Tautan dokumen: folder yang sudah kubagikan.',
          quality: 'acceptable',
        },
        { id: 's3-08-o3', label: 'Tautan dokumen: [tautan].', quality: 'good' },
      ],
      sensitive: {
        category: 'kredensial',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Sempurna! Tautan folder pribadi sering tidak dilindungi sandi. Siapa pun yang punya tautan bisa melihat isinya.',
          partial: 'Aman. Tautannya tidak terkirim.',
          wrong:
            'Tautan dokumen pribadi ibarat kunci rumah digital: siapa yang memilikinya bisa membuka folder berisi fotomu dan dokumen keluargamu.',
          tip: 'Ganti seluruh URL dengan [tautan].',
        },
      },
    },
    {
      id: 's3-09',
      text: 'Aku ikut lomba ini karena suka matematika.',
      options: [
        {
          id: 's3-09-o1',
          label:
            'Aku ikut lomba cerdas cermat mewakili SMP Negeri 3 Semarang karena suka matematika.',
          quality: 'poor',
        },
        {
          id: 's3-09-o2',
          label: 'Aku ikut lomba cerdas cermat tingkat kota karena suka matematika.',
          quality: 'acceptable',
        },
        {
          id: 's3-09-o3',
          label: 'Aku ikut lomba cerdas cermat karena suka matematika.',
          quality: 'good',
        },
      ],
    },
    {
      id: 's3-10',
      text: 'Batas pendaftarannya hari Jumat sore.',
      options: [
        {
          id: 's3-10-o1',
          label: 'Batas pendaftarannya Jumat 3 Oktober pukul 15.00 di Gedung Diponegoro.',
          quality: 'poor',
        },
        {
          id: 's3-10-o2',
          label: 'Batas pendaftarannya hari Jumat sore pukul 15.00.',
          quality: 'acceptable',
        },
        { id: 's3-10-o3', label: 'Batas pendaftarannya minggu ini sore hari.', quality: 'good' },
      ],
    },
    {
      id: 's3-11',
      text: 'Tolong balas dalam bentuk tabel yang rapi ya.',
      options: [
        {
          id: 's3-11-o1',
          label: 'Tolong balas dalam tabel, sekalian dengan NIK dan NISN-ku ya.',
          quality: 'poor',
        },
        {
          id: 's3-11-o2',
          label: 'Tolong balas dalam bentuk tabel yang rapi dan lengkap ya.',
          quality: 'acceptable',
        },
        { id: 's3-11-o3', label: 'Tolong balas dalam bentuk tabel ya.', quality: 'good' },
      ],
    },
  ],
}

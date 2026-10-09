import type { Scenario } from '@/domain/types'

/**
 * Skenario 1 — Mudah.
 * Semua nama, alamat, dan nomor di bawah adalah DATA FIKTIF.
 */
export const scenario1: Scenario = {
  id: 'perkenalan-diri',
  title: 'Memperkenalkan diri ke AI',
  difficulty: 1,
  context:
    'Kamu baru saja membuka aplikasi AI dan ingin berlatih percakapan bahasa Inggris. Kamu mengetik pesan perkenalan seperti di bawah ini.',
  aiTaskGoal:
    'AI hanya perlu tahu bahwa kamu ingin berlatih dialog bahasa Inggris untuk tugas sekolah, serta seleramu (hobi) supaya contohnya cocok untukmu.',
  learningObjectives: [
    'Membedakan data yang benar-benar dibutuhkan AI dengan data yang tidak perlu.',
    'Mengenali data pribadi tingkat tinggi seperti alamat rumah dan nomor telepon.',
    'Mempertahankan detail yang membuat jawaban AI tetap berguna.',
  ],
  segments: [
    {
      id: 's1-01',
      text: 'Halo, boleh kenalan?',
      options: [
        { id: 's1-01-o1', label: 'Halo, aku Raka dari SMP Negeri 3 Semarang.', quality: 'poor' },
        { id: 's1-01-o2', label: 'Halo, salam kenal dari Semarang.', quality: 'acceptable' },
        { id: 's1-01-o3', label: 'Halo, salam kenal.', quality: 'good' },
      ],
    },
    {
      id: 's1-02',
      text: 'Namaku Raka Aditya Pratama.',
      options: [
        { id: 's1-02-o1', label: 'Namaku Raka Aditya Pratama, murid kelas 8B.', quality: 'poor' },
        { id: 's1-02-o2', label: 'Namaku Raka, murid kelas 8B.', quality: 'acceptable' },
        { id: 's1-02-o3', label: 'Namaku Raka.', quality: 'good' },
      ],
      sensitive: {
        category: 'nama',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct:
            'Tepat! Nama lengkap bisa dipakai untuk menebak identitasmu. Nama panggilan saja sudah cukup supaya AI tetap bisa memanggilmu.',
          partial:
            'Oke, nama lengkapmu sudah tidak dikirim. Menghapus informasi pribadi memang aman, hanya pesanmu jadi sedikit kurang hangat.',
          wrong:
            'Nama lengkap adalah identitasmu. Kalau dikombinasikan dengan data lain (sekolah, kota), orang bisa lebih mudah mengenali siapa kamu.',
          tip: 'Untuk AI, nama panggilan saja sudah cukup.',
        },
      },
    },
    {
      id: 's1-03',
      text: 'Aku tinggal di Jl. Kenanga No. 12, Kelurahan Sukamaju, Kota Semarang.',
      options: [
        {
          id: 's1-03-o1',
          label: 'Aku tinggal di Jl. Kenanga No. 12, Kelurahan Sukamaju, Semarang.',
          quality: 'poor',
        },
        { id: 's1-03-o2', label: 'Aku tinggal di Kota Semarang.', quality: 'acceptable' },
        { id: 's1-03-o3', label: 'Aku tinggal di [alamat rumah].', quality: 'good' },
      ],
      sensitive: {
        category: 'alamat',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Sempurna! Alamat rumah lengkap tidak dibutuhkan AI, dan inilah data paling berbahaya jika bocor.',
          partial:
            'Aman. Menghapus alamat membuat pesanmu lebih pendek, tapi AI tetap bisa membantumu tanpa tahu rumahmu di mana.',
          wrong:
            'Alamat lengkap berarti rumahmu. AI tidak pernah membutuhkannya untuk membantu tugas, tetapi data ini sangat berbahaya jika sampai ke orang lain.',
          tip: 'Tanda "[alamat rumah]" sudah cukup, atau hapus saja bagian ini.',
        },
      },
    },
    {
      id: 's1-04',
      text: 'Nomor HP-ku 0812-0000-1234 kalau nanti mau dikabari.',
      options: [
        {
          id: 's1-04-o1',
          label: 'Nomor HP-ku 0812-0000-9999 kalau nanti mau dikabari.',
          quality: 'poor',
        },
        {
          id: 's1-04-o2',
          label: 'Nomor HP-ku yang bisa dihubungi nanti lewat kontak sekolah.',
          quality: 'acceptable',
        },
        { id: 's1-04-o3', label: 'Nomor HP yang bisa dihubungi nanti.', quality: 'good' },
      ],
      sensitive: {
        category: 'telepon',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Benar! AI tidak butuh nomor teleponmu. Cukup tulis bahwa ada nomor yang bisa dihubungi, tanpa angkanya.',
          partial: 'Masih aman. Yang penting angka nomormu tidak dikirim ke mana pun.',
          wrong:
            'Nomor HP dipakai untuk menghubungi, mengirim tautan penipuan, bahkan mengambil alih akun. AI tidak membutuhkannya untuk menulis puisi atau menjawab pertanyaanmu.',
          tip: 'Angka 08xx adalah tanda paling mudah dikenali sebagai data pribadi.',
        },
      },
    },
    {
      id: 's1-05',
      text: 'Aku sekolah di SMP Negeri 3 Semarang, kelas 8B.',
      options: [
        {
          id: 's1-05-o1',
          label: 'Aku sekolah di SMP Negeri 3 Semarang, kelas 8B, tahun ajaran 2026.',
          quality: 'poor',
        },
        {
          id: 's1-05-o2',
          label: 'Aku sekolah di sebuah SMP di Semarang, kelas 8B.',
          quality: 'acceptable',
        },
        { id: 's1-05-o3', label: 'Aku sekolah di sebuah SMP di Jawa Tengah.', quality: 'good' },
      ],
      sensitive: {
        category: 'sekolah',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct:
            'Bagus! Nama sekolah dan kelas membuat orang bisa menebak identitasmu. Versi umumnya tetap membuat AI paham konteksnya.',
          partial:
            'Cukup baik. Sekolahmu tidak disebutkan lagi, hanya saja AI jadi tidak tahu kamu berada di kota mana.',
          wrong:
            'Nama sekolah dan kelas adalah potongan identitas. Digabung dengan nama, orang bisa menemukan jejakmu di dunia nyata.',
          tip: 'Sebut level umum saja: "SMP di Jawa Tengah" atau "sekolahku".',
        },
      },
    },
    {
      id: 's1-06',
      text: 'Tolong bantu aku berlatih percakapan bahasa Inggris untuk tugas sekolah ya.',
      options: [
        {
          id: 's1-06-o1',
          label:
            'Tolong bantu aku berlatih percakapan bahasa Inggris, aku siswa kelas 8B di Semarang ya.',
          quality: 'poor',
        },
        {
          id: 's1-06-o2',
          label:
            'Tolong bantu aku berlatih percakapan bahasa Inggris untuk tugas sekolah kelas 8B ya.',
          quality: 'acceptable',
        },
        {
          id: 's1-06-o3',
          label: 'Tolong bantu aku berlatih percakapan bahasa Inggris ya.',
          quality: 'good',
        },
      ],
    },
    {
      id: 's1-07',
      text: 'Hobi aku main futsal dan membaca komik.',
      options: [
        {
          id: 's1-07-o1',
          label: 'Hobi aku main futsal setiap Jumat sore di GOR Sukamaju dan baca komik.',
          quality: 'poor',
        },
        {
          id: 's1-07-o2',
          label: 'Hobi aku main futsal setiap sore dan membaca komik.',
          quality: 'acceptable',
        },
        { id: 's1-07-o3', label: 'Hobi aku olahraga dan membaca.', quality: 'good' },
      ],
      sensitive: {
        category: 'umum',
        level: 'low',
        rule: { best: ['keep'], acceptable: ['generalize'] },
        feedback: {
          correct:
            'Tepat! Hobi umum tidak berbahaya, dan justru membuat contoh dialog AI lebih cocok denganmu.',
          partial:
            'Masih aman, hanya saja AI jadi kurang tahu seleramu sehingga contohnya lebih generik.',
          wrong:
            'Hobi umum tidak berbahaya. Menghapusnya membuat AI kehilangan referensi, sementara privasimu tidak ikut terlindungi.',
          tip: 'Tidak semua data harus dihapus. Tanyakan: "Apakah AI perlu ini untuk membantuku?"',
        },
      },
    },
    {
      id: 's1-08',
      text: 'Katamu, apa kalimat pembuka yang asyik?',
      options: [
        {
          id: 's1-08-o1',
          label: 'Katamu, pakai namaku Raka di kalimat pembukanya, ya?',
          quality: 'poor',
        },
        {
          id: 's1-08-o2',
          label: 'Katamu, apa kalimat pembuka yang asyik untuk murid kelas 8B?',
          quality: 'acceptable',
        },
        { id: 's1-08-o3', label: 'Menurutmu, apa kalimat pembuka yang asyik?', quality: 'good' },
      ],
    },
  ],
}

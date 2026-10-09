import type { Scenario } from '@/domain/types'

/**
 * Skenario 2 — Sedang.
 * Berisi data pihak ketiga (teman & guru) serta segmen pengecoh yang aman.
 * Semua nama, alamat, dan nomor di bawah adalah DATA FIKTIF.
 */
export const scenario2: Scenario = {
  id: 'tugas-dan-curhat',
  title: 'Minta bantuan tugas & curhat',
  difficulty: 2,
  context:
    'Kamu minta AI membantu membuat puisi, lalu bercerita sedikit tentang masalahmu dengan sahabat. Pesanmu berisi nama teman, nama guru, kelas, email, dan tanggal lahir.',
  aiTaskGoal:
    'AI cukup tahu bahwa kamu butuh puisi bertema persahabatan dan sedang ada masalah dengan teman. AI TIDAK perlu nama teman, nama guru, email, atau tanggal lahirmu.',
  learningObjectives: [
    'Menjaga data pihak ketiga (teman dan guru) yang kamu bagikan tanpa mereka tahu.',
    'Mengenali segmen yang terlihat pribadi tetapi sebenarnya aman.',
    'Menggunakan generalisasi agar cerita tetap bisa dibantu AI.',
  ],
  segments: [
    {
      id: 's2-01',
      text: 'Aku sedang mengerjakan tugas bahasa Indonesia: membuat puisi bertema persahabatan.',
      options: [
        {
          id: 's2-01-o1',
          label:
            'Aku sedang mengerjakan tugas bahasa Indonesia dari Bu Ratna: membuat puisi bertema persahabatan untuk kelas 8B.',
          quality: 'poor',
        },
        {
          id: 's2-01-o2',
          label:
            'Aku sedang mengerjakan tugas bahasa Indonesia: membuat puisi bertema persahabatan untuk kelas 8B.',
          quality: 'acceptable',
        },
        {
          id: 's2-01-o3',
          label: 'Aku sedang mengerjakan tugas sekolah: membuat puisi bertema persahabatan.',
          quality: 'good',
        },
      ],
    },
    {
      id: 's2-02',
      text: 'Ceritanya nanti tentang sahabatku, Dimas Aryo Nugroho.',
      options: [
        {
          id: 's2-02-o1',
          label: 'Ceritanya nanti tentang sahabatku Dimas Aryo, kelas 8B.',
          quality: 'poor',
        },
        {
          id: 's2-02-o2',
          label: 'Ceritanya nanti tentang sahabatku yang sekelas denganku.',
          quality: 'acceptable',
        },
        { id: 's2-02-o3', label: 'Ceritanya nanti tentang seorang sahabat.', quality: 'good' },
      ],
      sensitive: {
        category: 'keluarga_teman',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct:
            'Bagus! Temanmu tidak pernah memberi izin namanya dibagikan. Data pihak ketiga harus dijaga juga, bukan cuma datamu sendiri.',
          partial:
            'Aman. Nama temanmu tidak jadi terkirim, hanya AI kehilangan sedikit konteks cerita.',
          wrong:
            'Ini data orang lain. Menyebut nama lengkap teman tanpa izinnya melanggar privasinya, dan bisa membuat orang menebak hubunganmu.',
          tip: 'Ganti dengan "teman", "sahabat", atau "[nama teman]".',
        },
      },
    },
    {
      id: 's2-03',
      text: 'Bu Ratna Kusumawati yang memberi tugas ini.',
      options: [
        {
          id: 's2-03-o1',
          label: 'Bu Ratna, guru Bahasa Indonesia, yang memberi tugas ini.',
          quality: 'poor',
        },
        {
          id: 's2-03-o2',
          label: 'Guru Bahasa Indonesia yang memberi tugas ini.',
          quality: 'acceptable',
        },
        { id: 's2-03-o3', label: 'Guruku yang memberi tugas ini.', quality: 'good' },
      ],
      sensitive: {
        category: 'keluarga_teman',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct: 'Tepat! Cukup "guruku" — AI sudah paham maksudmu tanpa perlu nama beliau.',
          partial: 'Oke, nama gurumu tidak ikut terkirim.',
          wrong:
            'Nama guru juga data pribadi orang lain. Ditambah jabatannya, orang bisa tahu persis di sekolah mana kamu belajar.',
          tip: 'Kata "guru", "ayah", "teman" sudah menggantikan nama dengan aman.',
        },
      },
    },
    {
      id: 's2-04',
      text: 'Aku kelas 8B, tugasnya dikumpulkan minggu depan.',
      options: [
        {
          id: 's2-04-o1',
          label: 'Aku kelas 8B di SMP Negeri 3 Semarang, tugasnya dikumpulkan minggu depan.',
          quality: 'poor',
        },
        {
          id: 's2-04-o2',
          label: 'Aku kelas 8B, tugasnya dikumpulkan hari Jumat minggu depan.',
          quality: 'acceptable',
        },
        {
          id: 's2-04-o3',
          label: 'Aku kelas 8, tugasnya dikumpulkan minggu depan.',
          quality: 'good',
        },
      ],
      sensitive: {
        category: 'sekolah',
        level: 'low',
        rule: { best: ['keep'], acceptable: ['generalize'] },
        feedback: {
          correct:
            'Tepat! Nomor kelas saja tidak berbahaya, dan AI jadi tahu tingkat kesulitan yang pas untukmu.',
          partial: 'Masih aman, hanya saja AI jadi kurang tahu jenjangmu.',
          wrong:
            'Nomor kelas saja bukan rahasia. Menghapusnya membuat AI bingung memilihkan contoh yang sesuai umurmu.',
          tip: 'Tidak semua yang terlihat "pribadi" berbahaya. Tanyakan: apakah ini cukup untuk membantuku?',
        },
      },
    },
    {
      id: 's2-05',
      text: 'Email-ku nadia.restu08@smp.belajar.id kalau ada balasan.',
      options: [
        {
          id: 's2-05-o1',
          label: 'Email sekolahku nadia.restu08@smp.belajar.id kalau ada balasan.',
          quality: 'poor',
        },
        { id: 's2-05-o2', label: 'Email sekolahku kalau ada balasan.', quality: 'acceptable' },
        { id: 's2-05-o3', label: 'Email: [email], kalau ada balasan.', quality: 'good' },
      ],
      sensitive: {
        category: 'email',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback: {
          correct:
            'Sempurna! Email bisa dipakai untuk mengirim spam, phishing, bahkan mencoba memulihkan akunmu. AI tidak membutuhkannya.',
          partial: 'Aman. Emailmu tidak jadi terkirim.',
          wrong:
            'Email adalah "kunci pintu" ke akun-akunmu. Sekali bocor, orang bisa mengirim tautan berpura-pura dari sekolah atau temanmu.',
          tip: 'Ganti seluruh isi kotak "@" dengan [email].',
        },
      },
    },
    {
      id: 's2-06',
      text: 'Aku lahir 17 Maret 2011, jadi boleh ikut lomba umur SMP.',
      options: [
        {
          id: 's2-06-o1',
          label: 'Aku lahir 17 Maret 2011 di Semarang, jadi boleh ikut lomba umur SMP.',
          quality: 'poor',
        },
        {
          id: 's2-06-o2',
          label: 'Aku lahir Maret 2011, jadi boleh ikut lomba umur SMP.',
          quality: 'acceptable',
        },
        {
          id: 's2-06-o3',
          label: 'Aku lahir tahun 2011, jadi boleh ikut lomba umur SMP.',
          quality: 'good',
        },
      ],
      sensitive: {
        category: 'tanggal_lahir',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: {
          correct:
            'Tepat! Tanggal lahir lengkap sering dipakai sebagai pertanyaan keamanan akun. Tahun atau usia saja sudah cukup untuk AI.',
          partial: 'Cukup baik. Bagian pentingnya tidak lagi terlihat.',
          wrong:
            'Tanggal lahir lengkap adalah salah satu pertanyaan pemulihan akun yang paling umum. Gabungkan dengan nama dan kota, identitasmu bisa ditebak.',
          tip: 'Cukup sebut usia atau tahun kelahiran.',
        },
      },
    },
    {
      id: 's2-07',
      text: 'Aku sedang sedih karena bertengkar dengan sahabatku sejak minggu lalu.',
      options: [
        {
          id: 's2-07-o1',
          label:
            'Aku sedang sedih karena bertengkar dengan sahabatku Dimas Aryo Nugroho sejak minggu lalu.',
          quality: 'poor',
        },
        {
          id: 's2-07-o2',
          label: 'Aku sedang sedih karena bertengkar dengan sahabatku sejak Senin minggu lalu.',
          quality: 'acceptable',
        },
        {
          id: 's2-07-o3',
          label: 'Aku sedang sedih karena ada masalah dengan teman.',
          quality: 'good',
        },
      ],
    },
    {
      id: 's2-08',
      text: 'Aku suka menulis cerita sebelum tidur, kadang sampai lupa waktu.',
      options: [
        {
          id: 's2-08-o1',
          label: 'Aku suka menulis cerita tiap malam di kamar sampai jam 11.',
          quality: 'poor',
        },
        {
          id: 's2-08-o2',
          label: 'Aku suka menulis cerita sebelum tidur, hampir tiap malam.',
          quality: 'acceptable',
        },
        { id: 's2-08-o3', label: 'Aku suka menulis cerita di waktu luang.', quality: 'good' },
      ],
    },
    {
      id: 's2-09',
      text: 'Menurutmu, bagaimana cara memaafkan teman tanpa membuatnya tersinggung?',
      options: [
        {
          id: 's2-09-o1',
          label:
            'Menurutmu, bagaimana cara memaafkan sahabatku Dimas Aryo tanpa membuatnya tersinggung?',
          quality: 'poor',
        },
        {
          id: 's2-09-o2',
          label:
            'Menurutmu, bagaimana cara memaafkan teman yang sekelas tanpa membuatnya tersinggung?',
          quality: 'acceptable',
        },
        {
          id: 's2-09-o3',
          label:
            'Menurutmu, bagaimana cara memaafkan teman dengan baik tanpa membuatnya tersinggung?',
          quality: 'good',
        },
      ],
    },
  ],
}

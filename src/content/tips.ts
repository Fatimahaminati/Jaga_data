export interface Tip {
  id: string
  title: string
  body: string
}

/** Tips perlindungan data — ditampilkan di halaman Panduan. */
export const tips: Tip[] = [
  {
    id: 'tanya-kebutuhan',
    title: 'Tanyakan: “Apakah AI benar-benar perlu ini?”',
    body: 'Sebelum menempel teks, baca dulu tujuanmu. Kalau AI diminta membuat puisi, dia tidak perlu alamat, nomor HP, atau NIK.',
  },
  {
    id: 'sensor-angka',
    title: 'Angka panjang hampir selalu data pribadi',
    body: 'NIK 16 digit, NISN 10 digit, nomor HP, dan tanggal lahir lengkap lebih baik diganti [disensor] atau dihapus.',
  },
  {
    id: 'pihak-ketiga',
    title: 'Data orang lain juga harus dijaga',
    body: 'Nama teman, guru, dan orang tua ikut terbawa saat kamu menempel cerita. Ganti dengan “teman”, “guru”, atau [data orang tua].',
  },
  {
    id: 'kata-sandi',
    title: 'Kata sandi tidak pernah diketik ke chat',
    body: 'AI tidak pernah membutuhkan sandimu. Cukup tulis “kata sandi sudah diisi” pada formulir.',
  },
  {
    id: 'umumkan-bukan-hapus',
    title: 'Kadang cukup diumumkan, bukan dihapus',
    body: '“SMP di Semarang” membuat AI tetap paham konteks tanpa mengorbankan privasimu. Menghapus semua justru membuat jawaban AI tidak berguna.',
  },
  {
    id: 'kombinasi',
    title: 'Waspadai risiko gabungan',
    body: 'Nama kota mungkin aman, nama sekolah mungkin aman. Digabung dengan kelas dan hobi, orang bisa menebak siapa kamu. Kurangi jumlah detail spesifik.',
  },
  {
    id: 'sandi-sama',
    title: 'Jangan pakai sandi yang sama di banyak situs',
    body: 'Kalau satu situs bocor, akun lain ikut terbuka. Buat sandi berbeda dan simpan di pengelola sandi.',
  },
  {
    id: 'hapus-riwayat',
    body: 'Chat AI tersimpan di akun. Hapus percakapan yang berisi data pribadi setelah selesai.',
    title: 'Bersihkan riwayat chatmu',
  },
]

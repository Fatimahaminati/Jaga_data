/**
 * Model domain inti — PURE TypeScript.
 * File ini (dan seluruh `domain/`) tidak boleh mengimpor React, DOM, zustand,
 * atau localStorage. Lihat bagian 6 dokumen arsitektur.
 */

export type Action = 'keep' | 'remove' | 'generalize'

export type SensitivityLevel = 'high' | 'medium' | 'low' | 'safe'
// high   = wajib dihapus/diganti (mis. alamat lengkap, nomor telepon, NIK, kata sandi)
// medium = sebaiknya digeneralisasi (mis. nama sekolah, tanggal lahir lengkap)
// low    = boleh dipertahankan dengan hati-hati (mis. hobi umum)
// safe   = tidak sensitif, dan menghapusnya justru mengurangi kegunaan pesan

export type DataCategory =
  | 'nama'
  | 'alamat'
  | 'telepon'
  | 'email'
  | 'sekolah'
  | 'tanggal_lahir'
  | 'identitas'
  | 'kredensial'
  | 'foto_lokasi'
  | 'keluarga_teman'
  | 'umum'

export type Verdict = 'correct' | 'partial' | 'wrong'

export type Badge = 'pemula' | 'waspada' | 'penjaga_data'

export interface GeneralizeOption {
  id: string
  label: string // mis. "[alamat rumah]" atau "sebuah kota di Jawa Tengah"
  quality: 'good' | 'acceptable' | 'poor' // poor = masih terlalu spesifik
}

export interface RuleSpec {
  best: Action[] // aksi ideal
  acceptable: Action[] // aksi cukup baik (skor parsial)
  // selain keduanya dianggap keliru
}

export interface FeedbackSpec {
  correct: string // umpan balik jika ideal
  partial: string // jika cukup baik
  wrong: string // jika keliru, dengan penjelasan MENGAPA berisiko
  tip: string // tips praktis
}

export interface Segment {
  id: string
  text: string
  /**
   * Opsi generalisasi tersedia untuk SEMUA segmen (termasuk yang bukan data pribadi)
   * agar tampilan popover tidak membocorkan bagian mana yang sensitif.
   */
  options: GeneralizeOption[]
  /** Hanya segmen data pribadi yang memiliki blok `sensitive`. */
  sensitive?: {
    category: DataCategory
    level: SensitivityLevel
    rule: RuleSpec
    feedback: FeedbackSpec
  }
}

export interface Scenario {
  id: string
  title: string
  difficulty: 1 | 2 | 3
  context: string // situasi cerita (data fiktif)
  aiTaskGoal: string // tujuan pesan ke AI, agar siswa tahu apa yang perlu dipertahankan
  segments: Segment[]
  learningObjectives: string[]
}

export interface Decision {
  segmentId: string
  action: Action
  optionId?: string // wajib jika action === 'generalize'
}

export interface Attempt {
  id: string
  scenarioId: string
  decisions: Decision[]
  result: ScoreResult
  createdAt: string // ISO 8601
  durationMs: number
  hintUsed: boolean
}

export interface SegmentScore {
  segmentId: string
  verdict: Verdict
  points: number
  /** String kosong untuk segmen non-sensitif (teks generik diambil dari kamus UI). */
  feedback: string
  sensitive: boolean
  level: SensitivityLevel
}

export interface ScoreResult {
  total: number // 0..100
  privacyScore: number // seberapa baik data sensitif dilindungi
  utilityScore: number // seberapa baik pesan tetap berguna bagi AI
  perSegment: SegmentScore[]
  badge: Badge
}

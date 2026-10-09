import type { Badge, SensitivityLevel, Verdict } from '../types'

/** Bobot nilai akhir: total = 0,7 × privasi + 0,3 × kegunaan. */
export const WEIGHTS = {
  privacy: 0.7,
  utility: 0.3,
} as const

/** Bobot kontribusi tiap segmen sensitif terhadap skor privasi. */
export const LEVEL_WEIGHT: Record<SensitivityLevel, number> = {
  high: 1.5,
  medium: 1,
  low: 0.6,
  safe: 0,
}

/** Penalti tambahan bila data `high` justru dipertahankan. */
export const HIGH_KEEP_PENALTY = 0.5

/** Pengurangan nilai akhir ketika siswa menyalakan mode petunjuk (hint). */
export const HINT_PENALTY = 5

/** Poin per verdict pada komponen privasi. */
export const VERDICT_POINTS: Record<Verdict, number> = {
  correct: 1,
  partial: 0.5,
  wrong: 0,
}

/** Kualitas opsi generalisasi menentukan penurunan satu tingkat verdict. */
export const QUALITY_VERDICT_DOWNGRADE = ['poor'] as const

/** Ambang badge. */
export const BADGE_THRESHOLD: Record<Badge, number> = {
  pemula: 0,
  waspada: 50,
  penjaga_data: 80,
}

/**
 * Nilai kegunaan (utility) per segmen: seberapa tetap berguna pesan bagi AI.
 * - segmen netral (tanpa `sensitive`) dan level `safe`
 * - `keep` selalu 1 (kegunaan penuh; risikonya diukur skor privasi)
 */
export const UTILITY_VALUE: Record<
  SensitivityLevel,
  Record<'keep' | 'remove' | 'generalize', number>
> = {
  safe: { keep: 1, remove: 0, generalize: 0.7 },
  low: { keep: 1, remove: 0.4, generalize: 0.9 },
  medium: { keep: 1, remove: 0.75, generalize: 1 },
  high: { keep: 1, remove: 0.7, generalize: 1 },
}

/** Penyesuaian kegunaan berdasarkan kualitas opsi generalisasi. */
export const UTILITY_QUALITY_FACTOR: Record<'good' | 'acceptable' | 'poor', number> = {
  good: 1,
  acceptable: 0.85,
  poor: 0.55,
}

export function badgeFor(total: number): Badge {
  if (total >= BADGE_THRESHOLD.penjaga_data) return 'penjaga_data'
  if (total >= BADGE_THRESHOLD.waspada) return 'waspada'
  return 'pemula'
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

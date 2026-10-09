import type { Decision, ScoreResult, Scenario, SegmentScore } from '../types'
import {
  HIGH_KEEP_PENALTY,
  HINT_PENALTY,
  LEVEL_WEIGHT,
  WEIGHTS,
  badgeFor,
  clamp01,
  round1,
} from './config'
import { judgeSegment, utilityValueFor } from './rules'

export interface ScoreOptions {
  /** true bila siswa menyalakan mode petunjuk (hint) selama mengerjakan. */
  hintUsed?: boolean
}

/**
 * Mesin penilaian berbasis aturan — deterministik dan tanpa efek samping.
 *
 *   score(scenario, decisions) → ScoreResult
 *
 * Skor privasi: aksi ideal = poin penuh, cukup baik = 50%, keliru = 0.
 * Data `high` yang dipertahankan kena penalti ekstra.
 * Skor kegunaan: menghapus informasi yang sebenarnya dibutuhkan AI menurunkan skor,
 * sehingga siswa tidak sekadar "menghapus semuanya".
 *
 * Nilai akhir = 0,7 × privasi + 0,3 × kegunaan (− penalti hint).
 */
export function score(
  scenario: Scenario,
  decisions: Decision[],
  options: ScoreOptions = {},
): ScoreResult {
  const bySegment = new Map<string, Decision>()
  for (const decision of decisions) {
    if (scenario.segments.some((s) => s.id === decision.segmentId)) {
      bySegment.set(decision.segmentId, decision)
    }
  }

  const perSegment: SegmentScore[] = []
  let weightedPoints = 0
  let weightSum = 0
  let penalty = 0
  let utilitySum = 0

  for (const segment of scenario.segments) {
    const decision = bySegment.get(segment.id)
    const judged = judgeSegment(segment, decision)
    const level = segment.sensitive?.level ?? 'safe'
    const weight = LEVEL_WEIGHT[level]

    utilitySum += utilityValueFor(segment, decision)

    if (weight > 0) {
      weightSum += weight
      weightedPoints += weight * judged.points
      if (level === 'high' && judged.action === 'keep') {
        penalty += HIGH_KEEP_PENALTY
      }
    }

    perSegment.push({
      segmentId: segment.id,
      verdict: judged.verdict,
      points: judged.points,
      feedback: segment.sensitive ? segment.sensitive.feedback[judged.verdict] : '',
      sensitive: Boolean(segment.sensitive),
      level,
    })
  }

  const privacyRatio = weightSum > 0 ? clamp01((weightedPoints - penalty) / weightSum) : 1
  const utilityRatio = perSegment.length > 0 ? clamp01(utilitySum / perSegment.length) : 1

  const privacyScore = round1(privacyRatio * 100)
  const utilityScore = round1(utilityRatio * 100)
  const hintPenalty = options.hintUsed ? HINT_PENALTY : 0
  const total = round1(
    Math.max(0, WEIGHTS.privacy * privacyScore + WEIGHTS.utility * utilityScore - hintPenalty),
  )

  return {
    total,
    privacyScore,
    utilityScore,
    perSegment,
    badge: badgeFor(total),
  }
}

/** Alias eksplisit sesuai spesifikasi arsitektur: `score(scenario, decisions)`. */
export const scoreScenario = score

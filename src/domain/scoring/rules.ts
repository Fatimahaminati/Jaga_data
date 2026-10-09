import type { Action, Decision, GeneralizeOption, Segment, Verdict } from '../types'
import {
  QUALITY_VERDICT_DOWNGRADE,
  UTILITY_QUALITY_FACTOR,
  UTILITY_VALUE,
  VERDICT_POINTS,
} from './config'

export type ScoringErrorCode = 'MISSING_OPTION_ID' | 'UNKNOWN_OPTION_ID'

export class ScoringError extends Error {
  readonly code: ScoringErrorCode

  constructor(code: ScoringErrorCode, message: string) {
    super(message)
    this.name = 'ScoringError'
    this.code = code
  }
}

export interface JudgeResult {
  verdict: Verdict
  points: number
  action: Action
  option?: GeneralizeOption
}

/** Aksi efektif: keputusan yang belum dibuat dianggap mempertahankan (dibiarkan apa adanya). */
export function effectiveAction(decision: Decision | undefined): Action {
  return decision?.action ?? 'keep'
}

function verdictForRule(segment: Segment, action: Action): Verdict {
  const rule = segment.sensitive?.rule
  if (!rule) return action === 'keep' ? 'correct' : 'wrong'
  if (rule.best.includes(action)) return 'correct'
  if (rule.acceptable.includes(action)) return 'partial'
  return 'wrong'
}

function downgrade(verdict: Verdict): Verdict {
  return verdict === 'correct' ? 'partial' : 'wrong'
}

/**
 * Menilai satu segmen.
 * - Segmen sensitif: verdict mengikuti `rule` milik segmen.
 * - Segmen netral (tanpa blok `sensitive`): mempertahankan = benar, menghapus = keliru,
 *   mengganti = cukup baik.
 * - Kedua jenis segmen sama-sama memiliki opsi generalisasi supaya tampilan UI seragam
 *   dan tidak membocorkan mana yang data pribadi.
 * - `generalize` tanpa `optionId` valid akan DITOLAK (ScoringError).
 */
export function judgeSegment(segment: Segment, decision: Decision | undefined): JudgeResult {
  const action = effectiveAction(decision)

  if (action === 'generalize') {
    if (!decision?.optionId) {
      throw new ScoringError(
        'MISSING_OPTION_ID',
        `Segmen "${segment.id}" memilih generalisasi tetapi tidak ada opsi yang dipilih.`,
      )
    }

    const option = segment.options.find((item) => item.id === decision.optionId)
    if (!option) {
      throw new ScoringError(
        'UNKNOWN_OPTION_ID',
        `Opsi generalisasi "${decision.optionId}" tidak ditemukan pada segmen "${segment.id}".`,
      )
    }

    let verdict: Verdict = segment.sensitive ? verdictForRule(segment, action) : 'partial'
    if ((QUALITY_VERDICT_DOWNGRADE as readonly string[]).includes(option.quality)) {
      verdict = downgrade(verdict)
    }

    return { verdict, points: VERDICT_POINTS[verdict], action, option }
  }

  const verdict: Verdict = segment.sensitive
    ? verdictForRule(segment, action)
    : action === 'keep'
      ? 'correct'
      : 'wrong'

  return { verdict, points: VERDICT_POINTS[verdict], action }
}

/** Nilai kegunaan (0..1) satu segmen untuk keputusan tertentu. */
export function utilityValueFor(segment: Segment, decision: Decision | undefined): number {
  const level = segment.sensitive?.level ?? 'safe'
  const action = effectiveAction(decision)
  const base = UTILITY_VALUE[level][action]

  if (action !== 'generalize') return base

  const option = segment.options.find((item) => item.id === decision?.optionId)
  const factor = option ? UTILITY_QUALITY_FACTOR[option.quality] : 1
  return base * factor
}

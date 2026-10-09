import { z } from 'zod'
import type { Attempt, ScoreResult } from '../types'

/** Versi skema penyimpanan lokal — ubah bila format data berubah, lalu tambahkan migrasi. */
export const STORAGE_SCHEMA_VERSION = 1

export const decisionSchema = z.object({
  segmentId: z.string().min(1),
  action: z.enum(['keep', 'remove', 'generalize']),
  optionId: z.string().min(1).optional(),
})

export const segmentScoreSchema = z.object({
  segmentId: z.string().min(1),
  verdict: z.enum(['correct', 'partial', 'wrong']),
  points: z.number(),
  feedback: z.string(),
  sensitive: z.boolean(),
  level: z.enum(['high', 'medium', 'low', 'safe']),
})

export const scoreResultSchema = z.object({
  total: z.number().min(0).max(100),
  privacyScore: z.number().min(0).max(100),
  utilityScore: z.number().min(0).max(100),
  perSegment: z.array(segmentScoreSchema),
  badge: z.enum(['pemula', 'waspada', 'penjaga_data']),
})

export const attemptSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  decisions: z.array(decisionSchema),
  result: scoreResultSchema,
  createdAt: z.string().min(1),
  durationMs: z.number().nonnegative(),
  hintUsed: z.boolean(),
})

export const attemptListSchema = z.array(attemptSchema)

/**
 * Amplop yang ditulis middleware `persist` dari zustand:
 * `{ state, version }`. Divalidasi Zod setiap kali dibaca.
 */
export const progressEnvelopeSchema = z.object({
  state: z.object({
    attempts: attemptListSchema,
  }),
  version: z.number().int(),
})

export const settingsEnvelopeSchema = z.object({
  state: z.object({
    nickname: z.string().max(24),
    fontScale: z.number().min(0.9).max(1.5),
    highContrast: z.boolean(),
    hintsEnabled: z.boolean(),
  }),
  version: z.number().int(),
})

/** Draf otomatis per skenario (ditulis manual oleh hook autosave). */
export const draftSchema = z.object({
  scenarioId: z.string().min(1),
  decisions: z.array(decisionSchema),
  hintUsed: z.boolean(),
  updatedAt: z.string().min(1),
})

export type DraftRecord = z.infer<typeof draftSchema>

export function parseAttempts(raw: unknown): Attempt[] {
  const parsed = attemptListSchema.safeParse(raw)
  return parsed.success ? (parsed.data as Attempt[]) : []
}

export function parseScoreResult(raw: unknown): ScoreResult | null {
  const parsed = scoreResultSchema.safeParse(raw)
  return parsed.success ? (parsed.data as ScoreResult) : null
}

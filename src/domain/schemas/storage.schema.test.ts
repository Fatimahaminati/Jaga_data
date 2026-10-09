import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import type { Attempt, Decision, ScoreResult, SegmentScore } from '../types'
import {
  STORAGE_SCHEMA_VERSION,
  attemptListSchema,
  attemptSchema,
  decisionSchema,
  draftSchema,
  parseAttempts,
  parseScoreResult,
  progressEnvelopeSchema,
  scoreResultSchema,
  segmentScoreSchema,
  settingsEnvelopeSchema,
} from './storage.schema'

const decision: Decision = { segmentId: 'seg-1', action: 'keep', optionId: 'opt-1' }

const segmentScore: SegmentScore = {
  segmentId: 'seg-1',
  verdict: 'correct',
  points: 10,
  feedback: 'Tepat, data tetap aman.',
  sensitive: true,
  level: 'high',
}

const scoreResult: ScoreResult = {
  total: 80,
  privacyScore: 90,
  utilityScore: 70,
  perSegment: [{ ...segmentScore }],
  badge: 'penjaga_data',
}

const attempt: Attempt = {
  id: 'att-uji-1',
  scenarioId: 'skenario-uji',
  decisions: [{ ...decision }],
  result: scoreResult,
  createdAt: '2026-01-02T03:04:05.000Z',
  durationMs: 65_000,
  hintUsed: false,
}

function issuesOf(schema: z.ZodTypeAny, raw: unknown): z.ZodIssue[] {
  const result = schema.safeParse(raw)
  return result.success ? [] : result.error.issues
}

describe('STORAGE_SCHEMA_VERSION', () => {
  it('menyimpan versi skema saat ini', () => {
    expect(STORAGE_SCHEMA_VERSION).toBe(1)
  })
})

describe('decisionSchema', () => {
  it('menerima keputusan valid dengan dan tanpa opsi', () => {
    expect(decisionSchema.parse(decision)).toEqual(decision)
    expect(decisionSchema.parse({ segmentId: 'seg-1', action: 'remove' })).toEqual({
      segmentId: 'seg-1',
      action: 'remove',
    })
  })

  it('menolak segmen kosong, aksi di luar daftar, dan bidang yang hilang', () => {
    expect(issuesOf(decisionSchema, { ...decision, segmentId: '' })).toHaveLength(1)
    expect(issuesOf(decisionSchema, { ...decision, action: 'maybe' })).toHaveLength(1)
    expect(issuesOf(decisionSchema, { segmentId: 'seg-1' })).toHaveLength(1)
  })
})

describe('segmentScoreSchema', () => {
  it('menerima penilaian segmen yang valid', () => {
    expect(segmentScoreSchema.parse(segmentScore)).toEqual(segmentScore)
  })

  it('menolak nilai di luar daftar enum', () => {
    expect(issuesOf(segmentScoreSchema, { ...segmentScore, verdict: 'keliru' })).toHaveLength(1)
    expect(issuesOf(segmentScoreSchema, { ...segmentScore, level: 'sedang' })).toHaveLength(1)
  })

  it('menolak tipe data yang salah', () => {
    expect(issuesOf(segmentScoreSchema, { ...segmentScore, points: 'sepuluh' })).toHaveLength(1)
    expect(issuesOf(segmentScoreSchema, { ...segmentScore, sensitive: 'ya' })).toHaveLength(1)
    expect(issuesOf(segmentScoreSchema, { ...segmentScore, feedback: 7 })).toHaveLength(1)
  })
})

describe('scoreResultSchema', () => {
  it('menerima nilai skor pada batas 0 dan 100', () => {
    expect(
      scoreResultSchema.parse({ ...scoreResult, total: 0, privacyScore: 100, utilityScore: 0 }),
    ).toMatchObject({ total: 0, privacyScore: 100, utilityScore: 0 })
  })

  it('menolak skor di luar rentang 0..100', () => {
    expect(issuesOf(scoreResultSchema, { ...scoreResult, total: -1 })).toHaveLength(1)
    expect(issuesOf(scoreResultSchema, { ...scoreResult, privacyScore: 101 })).toHaveLength(1)
    expect(issuesOf(scoreResultSchema, { ...scoreResult, utilityScore: -0.5 })).toHaveLength(1)
  })

  it('menolak lencana yang tidak sah', () => {
    expect(issuesOf(scoreResultSchema, { ...scoreResult, badge: 'ahli' })).toHaveLength(1)
  })

  it('menolak rincian segmen yang melanggar skema', () => {
    expect(
      issuesOf(scoreResultSchema, {
        ...scoreResult,
        perSegment: [{ ...segmentScore, level: 'aman' }],
      }),
    ).toHaveLength(1)
    expect(issuesOf(scoreResultSchema, { ...scoreResult, perSegment: 'bukan-larik' })).toHaveLength(
      1,
    )
  })
})

describe('attemptSchema & attemptListSchema', () => {
  it('menerima satu percobaan lengkap', () => {
    expect(attemptSchema.parse(attempt)).toEqual(attempt)
    expect(attemptListSchema.parse([attempt])).toEqual([attempt])
  })

  it('menolak percobaan dengan bidang wajib kosong atau salah tipe', () => {
    expect(issuesOf(attemptSchema, { ...attempt, id: '' })).toHaveLength(1)
    expect(issuesOf(attemptSchema, { ...attempt, scenarioId: '' })).toHaveLength(1)
    expect(issuesOf(attemptSchema, { ...attempt, createdAt: '' })).toHaveLength(1)
    expect(issuesOf(attemptSchema, { ...attempt, hintUsed: 'ya' })).toHaveLength(1)
    expect(issuesOf(attemptSchema, { ...attempt, decisions: [{ segmentId: 's' }] })).toHaveLength(1)
  })

  it('menolak durasi negatif tetapi menerima nol', () => {
    expect(issuesOf(attemptSchema, { ...attempt, durationMs: -1 })).toHaveLength(1)
    expect(attemptSchema.parse({ ...attempt, durationMs: 0 }).durationMs).toBe(0)
  })

  it('attemptListSchema hanya menerima larik', () => {
    expect(issuesOf(attemptListSchema, { ...attempt })).toHaveLength(1)
    expect(attemptListSchema.parse([])).toEqual([])
  })
})

describe('progressEnvelopeSchema', () => {
  it('menerima amplop persist yang valid', () => {
    const envelope = { state: { attempts: [attempt] }, version: STORAGE_SCHEMA_VERSION }
    expect(progressEnvelopeSchema.parse(envelope)).toEqual(envelope)
  })

  it('menolak versi bukan bilangan bulat', () => {
    expect(
      issuesOf(progressEnvelopeSchema, { state: { attempts: [] }, version: 1.5 }),
    ).toHaveLength(1)
  })

  it('menolak isi state yang rusak dan versi yang hilang', () => {
    expect(
      issuesOf(progressEnvelopeSchema, { state: { attempts: 'rusak' }, version: 1 }),
    ).toHaveLength(1)
    expect(issuesOf(progressEnvelopeSchema, { state: { attempts: [] } })).toHaveLength(1)
    expect(issuesOf(progressEnvelopeSchema, 'bukan-objek')).toHaveLength(1)
  })
})

describe('settingsEnvelopeSchema', () => {
  const settings = {
    state: {
      nickname: 'Budi',
      fontScale: 1,
      highContrast: false,
      hintsEnabled: true,
    },
    version: 1,
  }

  it('menerima pengaturan valid pada batas nilainya', () => {
    expect(settingsEnvelopeSchema.parse(settings)).toEqual(settings)
    expect(
      settingsEnvelopeSchema.parse({
        ...settings,
        state: { ...settings.state, nickname: 'a'.repeat(24), fontScale: 0.9 },
      }),
    ).toBeTruthy()
    expect(
      settingsEnvelopeSchema.parse({ ...settings, state: { ...settings.state, fontScale: 1.5 } }),
    ).toBeTruthy()
  })

  it('menolak nama panggilan lebih dari 24 karakter', () => {
    const issues = issuesOf(settingsEnvelopeSchema, {
      ...settings,
      state: { ...settings.state, nickname: 'a'.repeat(25) },
    })
    expect(issues).toHaveLength(1)
    expect(issues[0].path).toEqual(['state', 'nickname'])
  })

  it('menolak skala huruf di luar 0.9..1.5', () => {
    expect(
      issuesOf(settingsEnvelopeSchema, {
        ...settings,
        state: { ...settings.state, fontScale: 0.8 },
      }),
    ).toHaveLength(1)
    expect(
      issuesOf(settingsEnvelopeSchema, {
        ...settings,
        state: { ...settings.state, fontScale: 1.6 },
      }),
    ).toHaveLength(1)
  })

  it('menolak bidang boolean dan versi yang salah tipe', () => {
    expect(
      issuesOf(settingsEnvelopeSchema, {
        ...settings,
        state: { ...settings.state, highContrast: 'ya' },
      }),
    ).toHaveLength(1)
    expect(issuesOf(settingsEnvelopeSchema, { ...settings, version: 'satu' })).toHaveLength(1)
  })
})

describe('draftSchema', () => {
  const draft = {
    scenarioId: 'skenario-uji',
    decisions: [{ ...decision }],
    hintUsed: false,
    updatedAt: '2026-01-02T03:04:05.000Z',
  }

  it('menerima draf yang valid', () => {
    expect(draftSchema.parse(draft)).toEqual(draft)
  })

  it('menolak draf dengan bidang wajib kosong', () => {
    expect(issuesOf(draftSchema, { ...draft, scenarioId: '' })).toHaveLength(1)
    expect(issuesOf(draftSchema, { ...draft, updatedAt: '' })).toHaveLength(1)
    expect(issuesOf(draftSchema, { ...draft, hintUsed: 1 })).toHaveLength(1)
    expect(issuesOf(draftSchema, { ...draft, decisions: 'bukan-larik' })).toHaveLength(1)
  })
})

describe('parseAttempts', () => {
  it('mengembalikan data valid apa adanya', () => {
    expect(parseAttempts([attempt])).toHaveLength(1)
    expect(parseAttempts([])).toEqual([])
  })

  it('mengembalikan larik kosong bila data rusak', () => {
    expect(parseAttempts('rusak')).toEqual([])
    expect(parseAttempts([{ ...attempt, durationMs: -5 }])).toEqual([])
    expect(parseAttempts(null)).toEqual([])
  })
})

describe('parseScoreResult', () => {
  it('mengembalikan data valid apa adanya', () => {
    expect(parseScoreResult(scoreResult)).toEqual(scoreResult)
  })

  it('mengembalikan null bila data rusak', () => {
    expect(parseScoreResult({ ...scoreResult, total: 200 })).toBeNull()
    expect(parseScoreResult('rusak')).toBeNull()
    expect(parseScoreResult(undefined)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import type { Decision, Scenario, Segment } from '../types'
import { badgeFor } from './config'
import { score, scoreScenario } from './engine'
import { ScoringError, judgeSegment } from './rules'

const feedback = { correct: 'benar', partial: 'sebagian', wrong: 'salah', tip: 'tips' }

const scenario: Scenario = {
  id: 'uji',
  title: 'Skenario uji',
  difficulty: 1,
  context: 'konteks',
  aiTaskGoal: 'tujuan',
  learningObjectives: ['tujuan 1'],
  segments: [
    {
      id: 'high1',
      text: 'Aku tinggal di Jl. Kenanga No. 1.',
      options: [
        { id: 'h1', label: '[alamat]', quality: 'good' },
        { id: 'h2', label: 'Jl. Kenanga', quality: 'poor' },
      ],
      sensitive: {
        category: 'alamat',
        level: 'high',
        rule: { best: ['remove', 'generalize'], acceptable: [] },
        feedback,
      },
    },
    {
      id: 'med1',
      text: 'Aku sekolah di SMP 3 Semarang.',
      options: [
        { id: 'm1', label: 'sebuah SMP', quality: 'good' },
        { id: 'm2', label: 'SMP 3 Semarang', quality: 'poor' },
      ],
      sensitive: {
        category: 'sekolah',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback,
      },
    },
    {
      id: 'low1',
      text: 'Hobiku main futsal.',
      options: [
        { id: 'l1', label: 'olahraga', quality: 'good' },
        { id: 'l2', label: 'futsal tiap Jumat', quality: 'poor' },
      ],
      sensitive: {
        category: 'umum',
        level: 'low',
        rule: { best: ['keep'], acceptable: ['generalize'] },
        feedback,
      },
    },
    {
      id: 'neutral1',
      text: 'Tolong bantu aku berlatih dialog.',
      options: [
        { id: 'n1', label: 'tolong bantu aku berlatih', quality: 'good' },
        { id: 'n2', label: 'bantu aku (siswa kelas 8B)', quality: 'poor' },
      ],
    },
  ],
}

const d = (segmentId: string, action: Decision['action'], optionId?: string): Decision => ({
  segmentId,
  action,
  optionId,
})

describe('score — privasi', () => {
  it('tanpa keputusan: skor privasi rendah, kegunaan penuh', () => {
    const result = score(scenario, [])

    expect(result.privacyScore).toBeCloseTo(3.2, 1)
    expect(result.utilityScore).toBe(100)
    expect(result.total).toBe(32.2)
    expect(result.badge).toBe('pemula')
  })

  it('semua dihapus: privasi naik tetapi kegunaan turun', () => {
    const result = score(scenario, [
      d('high1', 'remove'),
      d('med1', 'remove'),
      d('low1', 'remove'),
      d('neutral1', 'remove'),
    ])

    expect(result.privacyScore).toBeCloseTo(64.5, 1)
    expect(result.utilityScore).toBeLessThan(50)
    expect(result.utilityScore).toBeCloseTo(46.3, 1)
    expect(result.total).toBe(59)
  })

  it('keputusan ideal: skor penuh dan badge penjaga data', () => {
    const result = score(scenario, [
      d('high1', 'generalize', 'h1'),
      d('med1', 'generalize', 'm1'),
      d('low1', 'keep'),
    ])

    expect(result.privacyScore).toBe(100)
    expect(result.utilityScore).toBe(100)
    expect(result.total).toBe(100)
    expect(result.badge).toBe('penjaga_data')
  })

  it('data high yang dipertahankan kena penalti ekstra', () => {
    const kept = score(scenario, [
      d('med1', 'generalize', 'm1'),
      d('low1', 'keep'),
      d('high1', 'keep'),
    ])
    const replaced = score(scenario, [
      d('med1', 'generalize', 'm1'),
      d('low1', 'keep'),
      d('high1', 'generalize', 'h1'),
    ])

    expect(kept.privacyScore).toBeLessThan(replaced.privacyScore)
    expect(kept.total).toBeLessThan(replaced.total)
  })

  it('opsi generalisasi berkualitas poor diturunkan menjadi partial', () => {
    const result = score(scenario, [
      d('high1', 'generalize', 'h1'),
      d('med1', 'generalize', 'm2'),
      d('low1', 'keep'),
    ])
    const medScore = result.perSegment.find((item) => item.segmentId === 'med1')

    expect(medScore?.verdict).toBe('partial')
    expect(medScore?.points).toBe(0.5)
    expect(result.privacyScore).toBeLessThan(100)
  })

  it('menolak generalize tanpa optionId', () => {
    expect(() => score(scenario, [d('med1', 'generalize')])).toThrow(ScoringError)
    try {
      score(scenario, [d('high1', 'generalize')])
    } catch (error) {
      expect((error as ScoringError).code).toBe('MISSING_OPTION_ID')
    }
  })

  it('menolak optionId yang tidak dikenal', () => {
    expect(() => score(scenario, [d('med1', 'generalize', 'tidak-ada')])).toThrow(ScoringError)
    try {
      score(scenario, [d('med1', 'generalize', 'tidak-ada')])
    } catch (error) {
      expect((error as ScoringError).code).toBe('UNKNOWN_OPTION_ID')
    }
  })
})

describe('score — kegunaan & umpan balik', () => {
  it('segmen netral yang dihapus mendapat verdict keliru dan umpan balik generik', () => {
    const result = score(scenario, [d('neutral1', 'remove')])
    const neutral = result.perSegment.find((item) => item.segmentId === 'neutral1')

    expect(neutral?.verdict).toBe('wrong')
    expect(neutral?.sensitive).toBe(false)
    expect(neutral?.feedback).toBe('')
  })

  it('segmen netral yang dibiarkan dianggap tepat', () => {
    const result = score(scenario, [])
    const neutral = result.perSegment.find((item) => item.segmentId === 'neutral1')

    expect(neutral?.verdict).toBe('correct')
    expect(neutral?.points).toBe(1)
  })

  it('segmen netral yang diganti umum dianggap cukup baik', () => {
    const result = score(scenario, [d('neutral1', 'generalize', 'n1')])
    const neutral = result.perSegment.find((item) => item.segmentId === 'neutral1')

    expect(neutral?.verdict).toBe('partial')
    expect(neutral?.points).toBe(0.5)
  })

  it('umpan balik segmen sensitif diambil dari teks segmen', () => {
    const result = score(scenario, [d('high1', 'keep')])
    const high = result.perSegment.find((item) => item.segmentId === 'high1')

    expect(high?.feedback).toBe('salah')
  })

  it('setiap segmen muncul tepat sekali, berurutan', () => {
    const result = score(scenario, [])
    expect(result.perSegment.map((item) => item.segmentId)).toEqual(
      scenario.segments.map((s) => s.id),
    )
  })
})

describe('score — umum', () => {
  it('deterministik: input sama menghasilkan hasil sama', () => {
    const decisions = [d('high1', 'remove'), d('med1', 'generalize', 'm1'), d('low1', 'keep')]
    expect(score(scenario, decisions)).toEqual(score(scenario, decisions))
  })

  it('keputusan untuk segmen yang tidak ada diabaikan', () => {
    const baseline = score(scenario, [])
    const withGhost = score(scenario, [d('tidak-ada', 'remove')])
    expect(withGhost).toEqual(baseline)
  })

  it('mode petunjuk mengurangi skor total', () => {
    const decisions = [
      d('high1', 'generalize', 'h1'),
      d('med1', 'generalize', 'm1'),
      d('low1', 'keep'),
    ]
    const normal = score(scenario, decisions)
    const withHint = score(scenario, decisions, { hintUsed: true })

    expect(withHint.total).toBe(normal.total - 5)
    expect(withHint.privacyScore).toBe(normal.privacyScore)
  })

  it('skor selalu dibulatkan satu desimal dan berada di rentang 0..100', () => {
    const result = score(scenario, [d('high1', 'remove'), d('med1', 'remove')])

    for (const value of [result.total, result.privacyScore, result.utilityScore]) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
      expect(Math.round(value * 10) / 10).toBe(value)
    }
  })

  it('scoreScenario adalah alias dari score', () => {
    expect(scoreScenario(scenario, [])).toEqual(score(scenario, []))
  })
})

describe('badgeFor', () => {
  it('mengikuti ambang 50 dan 80', () => {
    expect(badgeFor(0)).toBe('pemula')
    expect(badgeFor(49.9)).toBe('pemula')
    expect(badgeFor(50)).toBe('waspada')
    expect(badgeFor(79.9)).toBe('waspada')
    expect(badgeFor(80)).toBe('penjaga_data')
    expect(badgeFor(100)).toBe('penjaga_data')
  })
})

describe('judgeSegment', () => {
  const segments = scenario.segments as Segment[]
  const byId = (id: string) => segments.find((segment) => segment.id === id)!

  it('aksi ideal = correct, cukup baik = partial, keliru = wrong', () => {
    expect(judgeSegment(byId('med1'), d('med1', 'generalize', 'm1')).verdict).toBe('correct')
    expect(judgeSegment(byId('med1'), d('med1', 'remove')).verdict).toBe('partial')
    expect(judgeSegment(byId('med1'), d('med1', 'keep')).verdict).toBe('wrong')
  })

  it('segmen netral: keep benar, remove keliru', () => {
    expect(judgeSegment(byId('neutral1'), undefined).verdict).toBe('correct')
    expect(judgeSegment(byId('neutral1'), d('neutral1', 'remove')).verdict).toBe('wrong')
  })
})

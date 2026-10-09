import { describe, expect, it } from 'vitest'
import type { Scenario, Segment } from '@/domain/types'
import { getScenario, nextScenario, scenarios } from '@/content/scenarios'
import {
  actionSchema,
  dataCategorySchema,
  feedbackSpecSchema,
  generalizeOptionSchema,
  parseScenario,
  ruleSpecSchema,
  scenarioSchema,
  segmentSchema,
  sensitivityLevelSchema,
} from './scenario.schema'

/* ————— Pabrik skenario fiktif untuk menguji jalur galat ————— */

const makeOption = (id: string, quality: 'good' | 'acceptable' | 'poor') => ({
  id,
  label: `Opsi ${id}`,
  quality,
})

const makeSegment = (id: string): Segment => ({
  id,
  text: `Pesan fiktif untuk segmen ${id}`,
  options: [makeOption(`${id}-good`, 'good'), makeOption(`${id}-poor`, 'poor')],
  sensitive: {
    category: 'nama',
    level: 'high',
    rule: { best: ['generalize'], acceptable: ['keep'] },
    feedback: {
      correct: 'Data berhasil digeneralisasi.',
      partial: 'Sebagian data masih terlihat.',
      wrong: 'Data pribadi masih terbaca utuh.',
      tip: 'Gunakan opsi yang lebih umum.',
    },
  },
})

const makeScenario = (): Scenario => ({
  id: 'skenario-uji',
  title: 'Skenario uji fiktif',
  difficulty: 1,
  context: 'Situasi latihan yang tidak nyata.',
  aiTaskGoal: 'Menyusun pesan aman untuk dikirim ke AI.',
  segments: [makeSegment('seg-1'), makeSegment('seg-2'), makeSegment('seg-3')],
  learningObjectives: ['Mengenali data pribadi dalam pesan'],
})

const issuesOf = (raw: unknown) => {
  const result = scenarioSchema.safeParse(raw)
  return result.success ? [] : result.error.issues
}

const messagesOf = (raw: unknown) => issuesOf(raw).map((issue) => issue.message)

describe('konten skenario', () => {
  it('tersedia tepat tiga skenario dengan tingkat 1, 2, dan 3', () => {
    expect(scenarios).toHaveLength(3)
    expect(scenarios.map((scenario) => scenario.difficulty).sort()).toEqual([1, 2, 3])
  })

  it('seluruh skenario lolos validasi Zod', () => {
    for (const scenario of scenarios) {
      const parsed = scenarioSchema.safeParse(scenario)
      expect(parsed.success, JSON.stringify(parsed.success ? [] : parsed.error.issues)).toBe(true)
    }
  })

  it('id skenario dan id segmen unik (global)', () => {
    const scenarioIds = scenarios.map((scenario) => scenario.id)
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length)

    const segmentIds = scenarios.flatMap((scenario) =>
      scenario.segments.map((segment) => segment.id),
    )
    expect(new Set(segmentIds).size).toBe(segmentIds.length)
  })

  it('setiap skenario punya minimal 4 segmen sensitif', () => {
    for (const scenario of scenarios) {
      const sensitive = scenario.segments.filter(
        (segment) => segment.sensitive && segment.sensitive.level !== 'safe',
      )
      expect(sensitive.length, scenario.id).toBeGreaterThanOrEqual(4)
    }
  })

  it('skenario 2 dan 3 punya segmen pengecoh (netral)', () => {
    for (const scenario of scenarios.slice(1)) {
      const neutral = scenario.segments.filter((segment) => !segment.sensitive)
      expect(neutral.length, scenario.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('tiap segmen punya minimal dua opsi; segmen sensitif punya umpan balik lengkap', () => {
    for (const scenario of scenarios) {
      for (const segment of scenario.segments) {
        expect(segment.options.length, segment.id).toBeGreaterThanOrEqual(2)
        if (!segment.sensitive) continue
        const { feedback } = segment.sensitive
        expect(feedback.correct.length).toBeGreaterThan(10)
        expect(feedback.partial.length).toBeGreaterThan(10)
        expect(feedback.wrong.length).toBeGreaterThan(10)
        expect(feedback.tip.length).toBeGreaterThan(5)
      }
    }
  })

  it('getScenario dan nextScenario bekerja sesuai urutan', () => {
    expect(getScenario(scenarios[0].id)?.title).toBe(scenarios[0].title)
    expect(getScenario('tidak-ada')).toBeUndefined()
    expect(nextScenario(scenarios[0].id)?.id).toBe(scenarios[1].id)
    expect(nextScenario(scenarios[2].id)).toBeUndefined()
  })
})

describe('scenarioSchema — jalur galat per bidang', () => {
  it('menolak id, judul, konteks, dan tujuan AI yang kosong', () => {
    expect(issuesOf({ ...makeScenario(), id: '' })[0].path).toEqual(['id'])
    expect(issuesOf({ ...makeScenario(), title: '' })[0].path).toEqual(['title'])
    expect(issuesOf({ ...makeScenario(), context: '' })[0].path).toEqual(['context'])
    expect(issuesOf({ ...makeScenario(), aiTaskGoal: '' })[0].path).toEqual(['aiTaskGoal'])
  })

  it('menolak tingkat kesulitan di luar 1..3', () => {
    const issues = issuesOf({ ...makeScenario(), difficulty: 4 })
    expect(issues[0].code).toBe('invalid_union')
    expect(issues[0].path).toEqual(['difficulty'])
    expect(scenarioSchema.safeParse({ ...makeScenario(), difficulty: 3 }).success).toBe(true)
  })

  it('menolak kurang dari tiga segmen', () => {
    const scenario = makeScenario()
    const issues = issuesOf({ ...scenario, segments: scenario.segments.slice(0, 2) })
    expect(issues[0].code).toBe('too_small')
    expect(issues[0].path).toEqual(['segments'])
  })

  it('menolak tujuan belajar kosong atau berisi string kosong', () => {
    expect(issuesOf({ ...makeScenario(), learningObjectives: [] })[0].path).toEqual([
      'learningObjectives',
    ])
    expect(issuesOf({ ...makeScenario(), learningObjectives: [''] })[0].path).toEqual([
      'learningObjectives',
      0,
    ])
  })

  it('menolak id segmen yang ganda', () => {
    const scenario = makeScenario()
    scenario.segments[2] = { ...scenario.segments[0] }

    const issues = issuesOf(scenario)
    expect(issues[0].message).toContain('id segmen "seg-1" ganda')
    expect(issues[0].path).toEqual(['segments', 2, 'id'])
  })

  it('menolak id opsi yang ganda dalam satu segmen', () => {
    const scenario = makeScenario()
    scenario.segments[0].options[1] = { ...scenario.segments[0].options[0] }

    const messages = messagesOf(scenario)
    expect(messages.some((message) => message.includes('id opsi "seg-1-good" ganda'))).toBe(true)
  })

  it('menolak segmen tanpa opsi berkualitas "good"', () => {
    const scenario = makeScenario()
    scenario.segments[0].options = [
      makeOption('cukup-1', 'acceptable'),
      makeOption('buruk-1', 'poor'),
    ]

    expect(messagesOf(scenario)).toContain(
      'segmen "seg-1" butuh minimal satu opsi berkualitas "good"',
    )
  })

  it('menolak segmen tanpa opsi pengecoh "poor"', () => {
    const scenario = makeScenario()
    scenario.segments[1].options = [
      makeOption('baik-2', 'good'),
      makeOption('cukup-2', 'acceptable'),
    ]

    expect(messagesOf(scenario)).toContain('segmen "seg-2" butuh minimal satu opsi pengecoh "poor"')
  })

  it('menolak skenario yang tidak punya segmen sensitif', () => {
    const scenario = makeScenario()
    scenario.segments = scenario.segments.map(({ id, text, options }) => ({ id, text, options }))

    expect(messagesOf(scenario)).toContain('skenario minimal memiliki satu segmen sensitif')
  })

  it('menolak skenario yang seluruh segmen sensitifnya berlevel aman', () => {
    const scenario = makeScenario()
    for (const segment of scenario.segments) {
      if (segment.sensitive) segment.sensitive.level = 'safe'
    }

    expect(messagesOf(scenario)).toContain('skenario minimal memiliki satu segmen sensitif')
  })
})

describe('subskema skenario', () => {
  it('actionSchema hanya menerima aksi yang dikenal', () => {
    expect(actionSchema.safeParse('keep').success).toBe(true)
    expect(actionSchema.safeParse('hapus').success).toBe(false)
  })

  it('dataCategorySchema menolak kategori di luar daftar', () => {
    expect(dataCategorySchema.safeParse('nomor-ktp').success).toBe(false)
    expect(dataCategorySchema.safeParse('alamat').success).toBe(true)
  })

  it('sensitivityLevelSchema menolak level di luar daftar', () => {
    expect(sensitivityLevelSchema.safeParse('critical').success).toBe(false)
    expect(sensitivityLevelSchema.safeParse('medium').success).toBe(true)
  })

  it('generalizeOptionSchema menolak id, label, dan kualitas yang kosong', () => {
    const option = makeOption('opt-1', 'good')
    expect(generalizeOptionSchema.safeParse(option).success).toBe(true)
    expect(generalizeOptionSchema.safeParse({ ...option, id: '' }).success).toBe(false)
    expect(generalizeOptionSchema.safeParse({ ...option, label: '' }).success).toBe(false)
    expect(generalizeOptionSchema.safeParse({ ...option, quality: 'bagus' }).success).toBe(false)
  })

  it('ruleSpecSchema menolak daftar aksi ideal yang kosong', () => {
    expect(ruleSpecSchema.safeParse({ best: ['keep'], acceptable: [] }).success).toBe(true)
    expect(ruleSpecSchema.safeParse({ best: [], acceptable: ['keep'] }).success).toBe(false)
  })

  it('feedbackSpecSchema menolak umpan balik yang kosong', () => {
    const feedback = {
      correct: 'Tepat sekali.',
      partial: 'Cukup baik.',
      wrong: 'Berisiko.',
      tip: 'Hindari.',
    }
    expect(feedbackSpecSchema.safeParse(feedback).success).toBe(true)
    expect(feedbackSpecSchema.safeParse({ ...feedback, tip: '' }).success).toBe(false)
    expect(feedbackSpecSchema.safeParse({ ...feedback, wrong: '' }).success).toBe(false)
  })

  it('segmentSchema menolak kurang dari dua opsi generalisasi', () => {
    const segment = makeSegment('seg-1')
    expect(segmentSchema.safeParse(segment).success).toBe(true)
    expect(segmentSchema.safeParse({ ...segment, options: [segment.options[0]] }).success).toBe(
      false,
    )
    expect(segmentSchema.safeParse({ ...segment, text: '' }).success).toBe(false)
  })
})

describe('parseScenario', () => {
  it('mengembalikan objek skenario yang tervalidasi', () => {
    expect(parseScenario(makeScenario()).id).toBe('skenario-uji')
    expect(parseScenario(makeScenario()).segments).toHaveLength(3)
  })

  it('melempar ZodError untuk data yang rusak', () => {
    expect(() => parseScenario({})).toThrow()
    expect(() => parseScenario(null)).toThrow()
  })
})

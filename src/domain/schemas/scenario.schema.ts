import { z } from 'zod'
import type { Scenario } from '../types'

export const actionSchema = z.enum(['keep', 'remove', 'generalize'])

export const sensitivityLevelSchema = z.enum(['high', 'medium', 'low', 'safe'])

export const dataCategorySchema = z.enum([
  'nama',
  'alamat',
  'telepon',
  'email',
  'sekolah',
  'tanggal_lahir',
  'identitas',
  'kredensial',
  'foto_lokasi',
  'keluarga_teman',
  'umum',
])

export const generalizeOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  quality: z.enum(['good', 'acceptable', 'poor']),
})

export const ruleSpecSchema = z.object({
  best: z.array(actionSchema).min(1),
  acceptable: z.array(actionSchema),
})

export const feedbackSpecSchema = z.object({
  correct: z.string().min(1),
  partial: z.string().min(1),
  wrong: z.string().min(1),
  tip: z.string().min(1),
})

export const segmentSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(generalizeOptionSchema).min(2),
  sensitive: z
    .object({
      category: dataCategorySchema,
      level: sensitivityLevelSchema,
      rule: ruleSpecSchema,
      feedback: feedbackSpecSchema,
    })
    .optional(),
})

export const scenarioSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    context: z.string().min(1),
    aiTaskGoal: z.string().min(1),
    segments: z.array(segmentSchema).min(3),
    learningObjectives: z.array(z.string().min(1)).min(1),
  })
  .superRefine((scenario, ctx) => {
    const ids = new Set<string>()
    scenario.segments.forEach((segment, index) => {
      if (ids.has(segment.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['segments', index, 'id'],
          message: `id segmen "${segment.id}" ganda`,
        })
      }
      ids.add(segment.id)

      // Setiap segmen butuh satu opsi berkualitas "good" dan satu "poor"
      // supaya pilihan siswa benar-benar diuji.
      const optionIds = new Set<string>()
      segment.options.forEach((option, optionIndex) => {
        if (optionIds.has(option.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['segments', index, 'options', optionIndex, 'id'],
            message: `id opsi "${option.id}" ganda pada segmen "${segment.id}"`,
          })
        }
        optionIds.add(option.id)
      })

      const qualities = segment.options.map((option) => option.quality)
      if (!qualities.includes('good')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['segments', index, 'options'],
          message: `segmen "${segment.id}" butuh minimal satu opsi berkualitas "good"`,
        })
      }
      if (!qualities.includes('poor')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['segments', index, 'options'],
          message: `segmen "${segment.id}" butuh minimal satu opsi pengecoh "poor"`,
        })
      }

      // `best`/`acceptable` hanya boleh berisi generalisasi bila ada opsi.
      if (segment.sensitive) {
        const actions = [...segment.sensitive.rule.best, ...segment.sensitive.rule.acceptable]
        if (actions.includes('generalize') && segment.options.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['segments', index, 'sensitive', 'rule'],
            message: `segmen "${segment.id}" mengizinkan generalisasi tetapi tidak punya opsi`,
          })
        }
      }
    })

    const sensitiveCount = scenario.segments.filter(
      (s) => s.sensitive && s.sensitive.level !== 'safe',
    ).length
    if (sensitiveCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['segments'],
        message: 'skenario minimal memiliki satu segmen sensitif',
      })
    }
  })

/** Validasi + mengubah data mentah menjadi tipe domain `Scenario`. */
export function parseScenario(raw: unknown): Scenario {
  return scenarioSchema.parse(raw) as Scenario
}

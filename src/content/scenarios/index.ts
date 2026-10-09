import { scenarioSchema } from '@/domain/schemas/scenario.schema'
import type { Scenario } from '@/domain/types'
import { scenario1 } from './01-perkenalan-diri'
import { scenario2 } from './02-tugas-dan-curhat'
import { scenario3 } from './03-formulir-dan-percakapan'

const rawScenarios: Scenario[] = [scenario1, scenario2, scenario3]

/**
 * Semua skenario divalidasi Zod saat dimuat. Bila ada yang tidak valid,
 * aplikasi berhenti dengan pesan yang jelas (kesalahan konten, bukan data pengguna).
 */
function validate(list: Scenario[]): Scenario[] {
  return list.map((scenario) => {
    const parsed = scenarioSchema.safeParse(scenario)
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')
      throw new Error(`Skenario "${scenario.id}" tidak valid — ${detail}`)
    }
    return scenario
  })
}

export const scenarios: Scenario[] = validate(rawScenarios)

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id)
}

export function nextScenario(id: string): Scenario | undefined {
  const index = scenarios.findIndex((scenario) => scenario.id === id)
  if (index === -1 || index === scenarios.length - 1) return undefined
  return scenarios[index + 1]
}

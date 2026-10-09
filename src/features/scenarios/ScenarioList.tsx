import type { Scenario } from '@/domain/types'
import { ScenarioCard } from './ScenarioCard'

export interface ScenarioListProps {
  scenarios: Scenario[]
  bestByScenario: Record<string, number>
  attemptsByScenario: Record<string, number>
  draftScenarioIds: string[]
}

export function ScenarioList({
  scenarios,
  bestByScenario,
  attemptsByScenario,
  draftScenarioIds,
}: ScenarioListProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <li key={scenario.id} className="h-full min-w-0">
          <ScenarioCard
            scenario={scenario}
            bestScore={bestByScenario[scenario.id] ?? null}
            attempts={attemptsByScenario[scenario.id] ?? 0}
            hasDraft={draftScenarioIds.includes(scenario.id)}
          />
        </li>
      ))}
    </ul>
  )
}

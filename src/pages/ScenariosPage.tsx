import { useMemo } from 'react'
import { strings } from '@/content/strings/id'
import { scenarios } from '@/content/scenarios'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { attemptsFor, bestScoreFor, useProgressStore } from '@/stores/progressStore'
import { ScenarioList } from '@/features/scenarios/ScenarioList'

export default function ScenariosPage() {
  const attempts = useProgressStore((state) => state.attempts)

  const bestByScenario = useMemo(() => {
    const map: Record<string, number> = {}
    for (const scenario of scenarios) {
      const best = bestScoreFor(attempts, scenario.id)
      if (best !== null) map[scenario.id] = best
    }
    return map
  }, [attempts])

  const attemptsByScenario = useMemo(() => {
    const map: Record<string, number> = {}
    for (const scenario of scenarios) {
      map[scenario.id] = attemptsFor(attempts, scenario.id).length
    }
    return map
  }, [attempts])

  const draftScenarioIds = useMemo(
    () =>
      localStorageRepo
        .listKeys('pdp:draft:')
        .map((key) => key.replace('pdp:draft:', ''))
        .filter((id) => scenarios.some((scenario) => scenario.id === id)),
    [],
  )

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-extrabold tracking-tight text-ink-900">{strings.scenarios.title}</h1>
        <p className="max-w-2xl fs-body leading-relaxed text-ink-600">
          {strings.scenarios.subtitle}
        </p>
        <p className="fs-body text-ink-500">{strings.app.fictionalNotice}</p>
      </header>

      <ScenarioList
        scenarios={scenarios}
        bestByScenario={bestByScenario}
        attemptsByScenario={attemptsByScenario}
        draftScenarioIds={draftScenarioIds}
      />
    </div>
  )
}

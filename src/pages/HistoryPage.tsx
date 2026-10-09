import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Trophy } from 'lucide-react'
import { strings } from '@/content/strings/id'
import { scenarios } from '@/content/scenarios'
import { exportCsv } from '@/infra/export/exportCsv'
import { exportJson } from '@/infra/export/exportJson'
import { averageScore, useProgressStore } from '@/stores/progressStore'
import { formatScore } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Disclosure } from '@/features/disclosure/Disclosure'
import { ExportMenu, type ExportItem } from '@/features/export/ExportMenu'
import { HistoryList } from '@/features/history/HistoryList'
import { ScoreChart, type ScorePoint } from '@/features/history/ScoreChart'

function titleOf(scenarioId: string): string {
  return scenarios.find((scenario) => scenario.id === scenarioId)?.title ?? scenarioId
}

export default function HistoryPage() {
  const attempts = useProgressStore((state) => state.attempts)
  const removeAttempt = useProgressStore((state) => state.removeAttempt)
  const clear = useProgressStore((state) => state.clear)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [cleared, setCleared] = useState(false)

  const bestByScenario = useMemo(() => {
    const map: Record<string, number> = {}
    for (const attempt of attempts) {
      map[attempt.scenarioId] = Math.max(map[attempt.scenarioId] ?? 0, attempt.result.total)
    }
    return map
  }, [attempts])

  const stats = useMemo(() => {
    const best = attempts.reduce((max, item) => Math.max(max, item.result.total), 0)
    const done = new Set(attempts.map((item) => item.scenarioId)).size
    return {
      attempts: attempts.length,
      best,
      average: averageScore(attempts),
      done,
    }
  }, [attempts])

  /** Grafik memakai urutan lama → baru agar terlihat perkembangannya. */
  const points = useMemo<ScorePoint[]>(() => {
    return [...attempts]
      .reverse()
      .slice(-12)
      .map((attempt, index) => ({
        label: String(index + 1),
        value: attempt.result.total,
      }))
  }, [attempts])

  const exportItems: ExportItem[] = useMemo(() => {
    if (attempts.length === 0) return []
    return [
      {
        id: 'csv',
        label: strings.export.csv,
        run: () => exportCsv(attempts, titleOf),
      },
      {
        id: 'json',
        label: strings.export.json,
        run: () => exportJson(attempts, 'riwayat'),
      },
    ]
  }, [attempts])

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    clear()
    setConfirmingClear(false)
    setCleared(true)
  }

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <h1 className="font-extrabold text-ink-900">{strings.history.title}</h1>
          <p className="fs-body leading-relaxed text-ink-600">{strings.history.subtitle}</p>
        </div>
        {attempts.length > 0 && (
          <ExportMenu items={exportItems} label={strings.export.label} align="end" />
        )}
      </header>

      {cleared && (
        <p
          role="status"
          className="rounded-xl bg-brand-50 px-4 py-3 fs-body leading-relaxed text-brand-800"
        >
          {strings.history.clearSuccess}
        </p>
      )}

      {attempts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="fs-h1 font-extrabold text-brand-600">0</p>
          <h2 className="mt-3 font-extrabold text-ink-900">{strings.history.emptyTitle}</h2>
          <p className="mt-2 fs-body leading-relaxed text-ink-600">{strings.history.emptyBody}</p>
          <Link to="/skenario" className="btn btn-primary mt-5 inline-flex">
            {strings.history.startFirst}
          </Link>
        </Card>
      ) : (
        <>
          <dl aria-label={strings.history.stats.attempts} className="grid gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <dt className="label-caps">{strings.history.stats.attempts}</dt>
              <dd className="mt-1 fs-h1 font-extrabold tabular-nums text-ink-900">
                {stats.attempts}
              </dd>
            </Card>
            <Card className="p-4">
              <dt className="label-caps">{strings.history.stats.best}</dt>
              <dd className="mt-1 flex items-center gap-2 fs-h1 font-extrabold tabular-nums text-ink-900">
                <Trophy size={18} className="text-amber-500" aria-hidden />
                {formatScore(stats.best)}
              </dd>
            </Card>
            <Card className="p-4">
              <dt className="label-caps">{strings.history.stats.average}</dt>
              <dd className="mt-1 fs-h1 font-extrabold tabular-nums text-ink-900">
                {stats.average === null ? strings.common.unknown : formatScore(stats.average)}
              </dd>
            </Card>
            <Card className="p-4">
              <dt className="label-caps">{strings.history.stats.scenariosDone}</dt>
              <dd className="mt-1 fs-h1 font-extrabold tabular-nums text-ink-900">
                {stats.done}
                <span className="fs-body font-semibold text-ink-500"> / {scenarios.length}</span>
              </dd>
            </Card>
          </dl>

          <Disclosure
            title={strings.history.chartTitle}
            icon={<BarChart3 size={18} className="text-brand-600" aria-hidden />}
          >
            <ScoreChart points={points} />
          </Disclosure>

          <HistoryList
            attempts={attempts}
            titleOf={titleOf}
            bestByScenario={bestByScenario}
            onDelete={removeAttempt}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-200 bg-accent-50/60 p-4">
            <div>
              <p className="fs-body font-bold text-accent-800">{strings.history.deleteTitle}</p>
              <p className="mt-1 fs-body leading-relaxed text-accent-700">
                {strings.history.deleteBody}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {confirmingClear && <Pill tone="neutral">{strings.common.confirm}</Pill>}
              <Button variant="danger" onClick={handleClear} aria-label={strings.history.deleteAll}>
                {strings.history.deleteAll}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

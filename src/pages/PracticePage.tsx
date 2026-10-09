import {
  ArrowLeft,
  Check,
  Gavel,
  Lightbulb,
  MousePointerClick,
  Redo2,
  RotateCcw,
  Send,
  Trophy,
  Undo2,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { getScenario } from '@/content/scenarios'
import { buildPreview, type Preview } from '@/domain/preview/buildPreview'
import type { Attempt } from '@/domain/types'
import { clearDraft, loadDraft, useAutosaveDraft } from '@/hooks/useAutosaveDraft'
import { createId } from '@/utils/id'
import { BeforeAfterPreview } from '@/features/editor/BeforeAfterPreview'
import { HintToggle } from '@/features/editor/HintToggle'
import { TokenEditor } from '@/features/editor/TokenEditor'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Pill } from '@/components/ui/Pill'

const EMPTY_PREVIEW: Preview = { before: '', after: '', parts: [] }

/** Ikon untuk tur 3 langkah di layar pengantar (teksnya di sebelah kanan). */
const INTRO_ICONS: ReactNode[] = [
  <MousePointerClick key="pilih" size={20} aria-hidden />,
  <Gavel key="tindakan" size={20} aria-hidden />,
  <Trophy key="skor" size={20} aria-hidden />,
]

export default function PracticePage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const scenario = scenarioId ? getScenario(scenarioId) : undefined

  const sessionScenarioId = useSessionStore((state) => state.scenarioId)
  const decisions = useSessionStore((state) => state.decisions)
  const hintUsed = useSessionStore((state) => state.hintUsed)
  const past = useSessionStore((state) => state.past)
  const future = useSessionStore((state) => state.future)
  const startScenario = useSessionStore((state) => state.startScenario)
  const setDecision = useSessionStore((state) => state.setDecision)
  const clearDecision = useSessionStore((state) => state.clearDecision)
  const undo = useSessionStore((state) => state.undo)
  const redo = useSessionStore((state) => state.redo)
  const reset = useSessionStore((state) => state.reset)
  const toggleHint = useSessionStore((state) => state.toggleHint)
  const submit = useSessionStore((state) => state.submit)
  const addAttempt = useProgressStore((state) => state.addAttempt)
  const hintsEnabled = useSettingsStore((state) => state.hintsEnabled)

  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  // Pengantar tampil sekali tiap kunjungan; dilewati kalau ada pekerjaan lanjutan.
  const [showIntro, setShowIntro] = useState(() => {
    if (!scenario) return false
    const resumingSession = sessionScenarioId === scenario.id && decisions.length > 0
    const resumingDraft = (loadDraft(scenario.id)?.decisions.length ?? 0) > 0
    return !resumingSession && !resumingDraft
  })

  useEffect(() => {
    if (!scenario || sessionScenarioId === scenario.id) return
    const draft = loadDraft(scenario.id)
    startScenario(scenario.id, {
      decisions: draft?.decisions ?? [],
      hintUsed: draft?.hintUsed ?? false,
    })
  }, [scenario, sessionScenarioId, startScenario])

  useAutosaveDraft(scenario?.id ?? null, decisions, hintUsed)

  const preview = useMemo(
    () => (scenario ? buildPreview(scenario, decisions) : EMPTY_PREVIEW),
    [scenario, decisions],
  )

  if (!scenario) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="font-extrabold text-ink-900">{strings.errors.scenarioMissing}</h1>
        <Link to="/skenario" className="btn btn-primary mt-4 inline-flex">
          {strings.nav.scenarios}
        </Link>
      </Card>
    )
  }

  if (sessionScenarioId !== scenario.id) {
    return (
      <p className="py-16 text-center text-ink-500" role="status">
        {strings.common.loading}
      </p>
    )
  }

  if (showIntro) {
    return (
      <div className="mx-auto grid max-w-xl gap-6">
        <Link
          to="/skenario"
          className="inline-flex min-h-[44px] items-center gap-2 self-start fs-button font-semibold text-ink-600 hover:text-brand-700"
        >
          <ArrowLeft size={16} aria-hidden />
          {strings.practice.backToScenarios}
        </Link>

        <Card className="grid gap-6 p-6">
          <div className="grid gap-2">
            <h1 className="font-extrabold text-ink-900">{strings.practice.introTitle}</h1>
            <p className="fs-body leading-relaxed text-ink-600">{strings.practice.introLead}</p>
          </div>

          <ol className="grid gap-4">
            {strings.practice.introSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                  aria-hidden
                >
                  {INTRO_ICONS[index]}
                </span>
                <span className="fs-body leading-relaxed text-ink-800">{step}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-xl bg-ink-50 p-4">
            <p className="label-caps">{strings.practice.introGoalsLabel}</p>
            <ul className="mt-2 grid gap-2">
              {scenario.learningObjectives.slice(0, 2).map((objective) => (
                <li
                  key={objective}
                  className="flex items-start gap-2 fs-body leading-relaxed text-ink-700"
                >
                  <Check size={18} className="mt-1 shrink-0 text-brand-600" aria-hidden />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <Button size="lg" className="w-full" onClick={() => setShowIntro(false)}>
            {strings.practice.introStart}
          </Button>
        </Card>
      </div>
    )
  }

  const total = scenario.segments.length
  const reviewed = decisions.length
  const progressPercent = total === 0 ? 0 : Math.round((reviewed / total) * 100)

  const handleSubmit = () => {
    const result = submit(scenario)
    const { durationMs } = useSessionStore.getState()
    const attempt: Attempt = {
      id: createId('att'),
      scenarioId: scenario.id,
      decisions,
      result,
      createdAt: new Date().toISOString(),
      durationMs,
      hintUsed,
    }
    addAttempt(attempt)
    clearDraft(scenario.id)
    navigate(`/hasil/${attempt.id}`)
  }

  return (
    <div className="grid gap-6">
      <Link
        to="/skenario"
        className="inline-flex min-h-[44px] items-center gap-2 self-start fs-button font-semibold text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft size={16} aria-hidden />
        {strings.practice.backToScenarios}
      </Link>

      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            tone={
              scenario.difficulty === 3 ? 'accent' : scenario.difficulty === 2 ? 'amber' : 'brand'
            }
          >
            {strings.scenarios.difficultyLabel}: {strings.scenarios.difficulty[scenario.difficulty]}
          </Pill>
          <Pill tone="neutral">{strings.practice.fictionalBadge}</Pill>
        </div>
        <h1 className="font-extrabold text-ink-900">{scenario.title}</h1>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-4">
            <h2 className="label-caps">{strings.practice.contextTitle}</h2>
            <p className="mt-1 fs-body leading-relaxed text-ink-700">{scenario.context}</p>
          </Card>
          <Card className="p-4">
            <h2 className="label-caps">{strings.practice.goalTitle}</h2>
            <p className="mt-1 fs-body leading-relaxed text-ink-700">{scenario.aiTaskGoal}</p>
          </Card>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="pesan">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="pesan" className="font-extrabold text-ink-900">
              {strings.practice.messageTitle}
            </h2>
            {hintsEnabled && <HintToggle active={hintUsed} onToggle={toggleHint} />}
          </div>
          {hintUsed && (
            <p
              className="mb-3 rounded-xl bg-amber-50 px-3 py-2 fs-body text-amber-800"
              role="status"
            >
              <Lightbulb size={16} className="mr-1 inline" aria-hidden />
              {strings.practice.hintActive}
            </p>
          )}

          <TokenEditor
            scenario={scenario}
            decisions={decisions}
            hintActive={hintUsed}
            onChange={setDecision}
            onClear={clearDecision}
          />
        </section>

        <aside className="grid gap-4 self-start lg:sticky lg:top-24">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="fs-body font-bold text-ink-800">
                {strings.practice.reviewedProgress(reviewed, total)}
              </p>
              <span className="fs-body font-extrabold tabular-nums text-brand-700">
                {progressPercent}%
              </span>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-ink-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={reviewed}
              aria-label={strings.a11y.progress}
            >
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 fs-small text-ink-500">
              {reviewed === total
                ? strings.practice.reviewedAll
                : strings.practice.decisionCount(reviewed)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                icon={<Undo2 size={16} aria-hidden />}
                disabled={past.length === 0}
                onClick={undo}
              >
                {strings.practice.undo}
              </Button>
              <Button
                variant="secondary"
                icon={<Redo2 size={16} aria-hidden />}
                disabled={future.length === 0}
                onClick={redo}
              >
                {strings.practice.redo}
              </Button>
              <Button
                variant="ghost"
                icon={<RotateCcw size={16} aria-hidden />}
                disabled={decisions.length === 0}
                onClick={() => setConfirmReset(true)}
              >
                {strings.practice.reset}
              </Button>
            </div>

            <p className="mt-3 fs-small text-ink-500">{strings.practice.draftSaved}</p>
          </Card>

          <BeforeAfterPreview preview={preview} />

          <Button size="lg" icon={<Send size={18} aria-hidden />} onClick={handleSubmit}>
            {strings.practice.submit}
          </Button>
        </aside>
      </div>

      <Dialog.Root open={confirmReset} onOpenChange={setConfirmReset}>
        <Dialog.Content
          title={strings.practice.resetConfirmTitle}
          description={strings.practice.resetConfirmBody}
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              {strings.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset()
                setConfirmReset(false)
              }}
            >
              {strings.common.confirm}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}

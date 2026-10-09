import {
  ArrowRight,
  Eye,
  History,
  ListChecks,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { getScenario, nextScenario } from '@/content/scenarios'
import { buildPreview } from '@/domain/preview/buildPreview'
import type { Verdict } from '@/domain/types'
import { exportJson } from '@/infra/export/exportJson'
import { exportPdf, type PdfDocumentSpec } from '@/infra/export/exportPdf'
import { exportPng } from '@/infra/export/exportPng'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDateTime, formatDuration, formatScore } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Disclosure } from '@/features/disclosure/Disclosure'
import { BeforeAfterPreview } from '@/features/editor/BeforeAfterPreview'
import { ResultSummary, ScoreMetrics } from '@/features/feedback/ResultSummary'
import { SegmentFeedbackList, TopFeedbackList } from '@/features/feedback/SegmentFeedbackList'
import { ExportMenu, type ExportItem } from '@/features/export/ExportMenu'

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const attempts = useProgressStore((state) => state.attempts)
  const nickname = useSettingsStore((state) => state.nickname)
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)

  const attempt = attempts.find((item) => item.id === attemptId)
  const scenario = attempt ? getScenario(attempt.scenarioId) : undefined

  const preview = useMemo(() => {
    if (!attempt || !scenario) return { before: '', after: '', parts: [] }
    return buildPreview(scenario, attempt.decisions)
  }, [attempt, scenario])

  const verdicts = useMemo(() => {
    const map: Record<string, Verdict> = {}
    for (const item of attempt?.result.perSegment ?? []) {
      map[item.segmentId] = item.verdict
    }
    return map
  }, [attempt])

  if (!attempt || !scenario) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="font-extrabold text-ink-900">{strings.errors.attemptMissing}</h1>
        <Link to="/riwayat" className="btn btn-primary mt-4 inline-flex">
          {strings.nav.history}
        </Link>
      </Card>
    )
  }

  const title = strings.result.scoreFor(scenario.title)
  const next = nextScenario(scenario.id)

  const buildPdfSpec = (): PdfDocumentSpec => ({
    title: `${strings.app.name} — ${strings.result.title}`,
    subtitle: `${scenario.title} · ${formatDateTime(attempt.createdAt)}${
      nickname ? ` · ${nickname}` : ''
    }`,
    scores: [
      { label: strings.result.total, value: formatScore(attempt.result.total) },
      { label: strings.result.privacy, value: formatScore(attempt.result.privacyScore) },
      { label: strings.result.utility, value: formatScore(attempt.result.utilityScore) },
      { label: strings.result.badgeLabel, value: strings.badge[attempt.result.badge].label },
    ],
    meta: [
      {
        label: strings.result.usedHint,
        value: attempt.hintUsed ? strings.common.yes : strings.common.no,
      },
      { label: strings.history.dateLabel, value: formatDateTime(attempt.createdAt) },
    ],
    sectionHeading: strings.result.summaryTitle,
    beforeHeading: strings.preview.before,
    afterHeading: strings.preview.after,
    before: preview.before,
    after: preview.after,
    feedbackHeading: strings.result.perSegmentTitle,
    feedback: attempt.result.perSegment.map((item) => {
      const segment = scenario.segments.find((s) => s.id === item.segmentId)
      return {
        verdict: strings.verdict[item.verdict],
        text: segment ? segment.text : item.segmentId,
        note: item.feedback || strings.result.neutralFeedback[item.verdict],
      }
    }),
    footer: `${strings.app.privacyNotice} — ${strings.app.fictionalNotice}`,
  })

  const exportItems: ExportItem[] = [
    {
      id: 'pdf',
      label: strings.export.pdf,
      run: () => exportPdf(buildPdfSpec(), `${scenario.id}-hasil`),
    },
    {
      id: 'png',
      label: strings.export.png,
      run: async () => {
        if (!cardRef.current) return
        await exportPng(cardRef.current, `hasil-${scenario.id}`)
      },
    },
    {
      id: 'json',
      label: strings.export.json,
      run: () => exportJson([attempt], `hasil-${scenario.id}`),
    },
  ]

  const handleRetry = () => {
    useSessionStore.getState().clear()
    navigate(`/latihan/${scenario.id}`)
  }

  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <h1 className="font-extrabold text-ink-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-3 fs-body text-ink-600">
          <span>{strings.result.savedLocally}</span>
          <Pill tone="neutral">
            {formatDateTime(attempt.createdAt)} · {formatDuration(attempt.durationMs)}
          </Pill>
        </div>
      </header>

      <div ref={cardRef} className="surface p-6">
        <ResultSummary
          result={attempt.result}
          hintUsed={attempt.hintUsed}
          caption={scenario.title}
        />
      </div>

      <section aria-labelledby="hal-teratas" className="surface p-6">
        <h2 id="hal-teratas" className="flex items-center gap-2 font-extrabold text-ink-900">
          <ListChecks size={18} className="text-brand-600" aria-hidden />
          {strings.result.topTitle}
        </h2>
        <div className="mt-4">
          <TopFeedbackList scenario={scenario} result={attempt.result} />
        </div>
      </section>

      <Disclosure
        title={strings.result.perSegmentTitle}
        icon={<MessageSquare size={18} className="text-brand-600" aria-hidden />}
      >
        <SegmentFeedbackList
          scenario={scenario}
          decisions={attempt.decisions}
          result={attempt.result}
        />
      </Disclosure>

      <Disclosure
        title={strings.result.summaryTitle}
        icon={<Eye size={18} className="text-brand-600" aria-hidden />}
      >
        <BeforeAfterPreview preview={preview} verdicts={verdicts} />
      </Disclosure>

      <Disclosure
        title={strings.result.detailScoresTitle}
        icon={<ShieldCheck size={18} className="text-brand-600" aria-hidden />}
      >
        <ScoreMetrics result={attempt.result} />
      </Disclosure>

      <div className="flex flex-wrap items-center gap-3">
        {next ? (
          <Link to={`/latihan/${next.id}`} className="btn btn-primary btn-lg">
            {strings.result.nextScenario}
            <ArrowRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link to="/skenario" className="btn btn-primary btn-lg">
            {strings.result.backToScenarios}
          </Link>
        )}
        <Button
          variant="secondary"
          size="lg"
          icon={<RotateCcw size={18} aria-hidden />}
          onClick={handleRetry}
        >
          {strings.common.retry}
        </Button>
        <Link to="/riwayat" className="btn btn-ghost btn-lg">
          <History size={18} aria-hidden />
          {strings.result.viewHistory}
        </Link>
        <span className="ml-auto">
          <ExportMenu items={exportItems} label={strings.export.label} align="end" />
        </span>
      </div>
    </div>
  )
}

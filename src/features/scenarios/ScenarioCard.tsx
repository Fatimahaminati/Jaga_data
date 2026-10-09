import {
  ArrowRight,
  BookOpen,
  ClipboardPaste,
  FileText,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import type { Scenario } from '@/domain/types'
import { formatScore } from '@/utils/date'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'

export interface ScenarioCardProps {
  scenario: Scenario
  bestScore: number | null
  attempts: number
  hasDraft: boolean
}

const DIFFICULTY_TONE = { 1: 'brand', 2: 'amber', 3: 'accent' } as const

/** Ikon dekoratif per skenario, supaya kartu mudah dibedakan sekilas. */
const SCENARIO_ICONS: Record<string, LucideIcon> = {
  'perkenalan-diri': MessageSquareText,
  'tugas-dan-curhat': BookOpen,
  'formulir-dan-percakapan': ClipboardPaste,
}
const FALLBACK_ICON: LucideIcon = FileText

/** Satu kalimat pendek untuk kartu: kalimat pertama dari situasi skenario. */
function firstSentence(text: string): string {
  const stop = text.search(/[.!?]/)
  return (stop === -1 ? text : text.slice(0, stop + 1)).trim()
}

export function ScenarioCard({ scenario, bestScore, attempts, hasDraft }: ScenarioCardProps) {
  const Icon = SCENARIO_ICONS[scenario.id] ?? FALLBACK_ICON
  const summary = firstSentence(scenario.context)

  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"
        >
          <Icon size={24} />
        </span>
        <h2 className="min-w-0 break-words font-extrabold text-ink-900">{scenario.title}</h2>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Pill tone={DIFFICULTY_TONE[scenario.difficulty]}>
          {strings.scenarios.difficultyLabel}: {strings.scenarios.difficulty[scenario.difficulty]}
        </Pill>
        <Pill tone="neutral">
          {scenario.segments.length} {strings.scenarios.segmentCount}
        </Pill>
        {hasDraft && <Pill tone="amber">{strings.home.resumeDraft}</Pill>}
      </div>

      <p className="min-w-0 break-words fs-body leading-relaxed text-ink-600">{summary}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="min-w-0 break-words fs-body text-ink-500">
          {bestScore === null ? (
            strings.scenarios.notAttempted
          ) : (
            <>
              {strings.scenarios.bestScore}:{' '}
              <strong className="font-bold text-ink-900">{formatScore(bestScore)}</strong> ·{' '}
              {attempts} {strings.scenarios.attempts}
            </>
          )}
        </p>
        <Link to={`/latihan/${scenario.id}`} className="btn btn-primary">
          {attempts > 0 ? strings.scenarios.continue : strings.scenarios.start}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </Card>
  )
}

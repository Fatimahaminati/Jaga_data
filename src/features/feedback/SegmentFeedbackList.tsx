import { Check, Info, X } from 'lucide-react'
import { strings } from '@/content/strings/id'
import type { Decision, Scenario, ScoreResult, Verdict } from '@/domain/types'
import { Pill } from '@/components/ui/Pill'
import { cx } from '@/utils/cx'

export interface SegmentFeedbackListProps {
  scenario: Scenario
  decisions: Decision[]
  result: ScoreResult
}

export interface TopFeedbackListProps {
  scenario: Scenario
  result: ScoreResult
  /** Jumlah segmen yang ditampilkan (default 3). */
  limit?: number
}

const VERDICT_CLASS: Record<Verdict, string> = {
  correct: 'verdict-correct',
  partial: 'verdict-partial',
  wrong: 'verdict-wrong',
}

/** Semakin kecil, semakin buruk — dipakai untuk mengurutkan hal teratas. */
const VERDICT_RANK: Record<Verdict, number> = { wrong: 0, partial: 1, correct: 2 }

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === 'correct') return <Check size={14} aria-hidden />
  if (verdict === 'wrong') return <X size={14} aria-hidden />
  return <Info size={14} aria-hidden />
}

export function SegmentFeedbackList({ scenario, decisions, result }: SegmentFeedbackListProps) {
  const segmentById = new Map(scenario.segments.map((segment) => [segment.id, segment]))
  const decisionById = new Map(decisions.map((decision) => [decision.segmentId, decision]))

  return (
    <ol className="grid gap-3">
      {result.perSegment.map((item) => {
        const segment = segmentById.get(item.segmentId)
        if (!segment) return null
        const decision = decisionById.get(item.segmentId)
        const actionLabel = decision ? strings.action[decision.action] : strings.practice.untouched
        const feedbackText = segment.sensitive
          ? item.feedback
          : strings.result.neutralFeedback[item.verdict]
        const chosenGeneralization = decision?.optionId
          ? segment.options.find((option) => option.id === decision.optionId)?.label
          : undefined

        return (
          <li key={item.segmentId} className="surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 fs-small font-bold',
                  VERDICT_CLASS[item.verdict],
                )}
              >
                <VerdictIcon verdict={item.verdict} />
                {strings.verdict[item.verdict]}
              </span>
              <Pill tone="neutral">{actionLabel}</Pill>
              {segment.sensitive && (
                <>
                  <Pill tone="brand">{strings.feedback.category[segment.sensitive.category]}</Pill>
                  <Pill tone={segment.sensitive.level === 'high' ? 'accent' : 'amber'}>
                    {strings.feedback.levelLabel}: {strings.feedback.level[segment.sensitive.level]}
                  </Pill>
                </>
              )}
              {!segment.sensitive && <Pill tone="neutral">{strings.feedback.safeLabel}</Pill>}
            </div>

            <p className="mt-2 fs-body font-semibold leading-relaxed text-ink-900">
              “{segment.text}”
            </p>
            {chosenGeneralization && (
              <p className="mt-1 fs-body leading-relaxed text-ink-600">
                {strings.preview.after}:{' '}
                <span className="font-semibold text-accent-700">{chosenGeneralization}</span>
              </p>
            )}
            <p className="mt-1 fs-body leading-relaxed text-ink-700">{feedbackText}</p>

            {segment.sensitive && item.verdict !== 'correct' && (
              <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 fs-body leading-relaxed text-brand-800">
                <strong>{strings.feedback.tipLabel}:</strong> {segment.sensitive.feedback.tip}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Maksimal 3 hal terburuk untuk diperbaiki — ringkasan satu baris per segmen.
 * Versi lengkapnya ada di accordion "Penjelasan tiap keputusan".
 */
export function TopFeedbackList({ scenario, result, limit = 3 }: TopFeedbackListProps) {
  const segmentById = new Map(scenario.segments.map((segment) => [segment.id, segment]))

  const items = result.perSegment
    .filter((item) => item.verdict !== 'correct')
    .sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict])
    .slice(0, limit)

  if (items.length === 0) {
    return <p className="fs-body leading-relaxed text-ink-600">{strings.result.topEmpty}</p>
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => {
        const segment = segmentById.get(item.segmentId)
        const note = item.feedback || strings.result.neutralFeedback[item.verdict]

        return (
          <li key={item.segmentId} className="rounded-xl border border-ink-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 fs-small font-bold',
                  VERDICT_CLASS[item.verdict],
                )}
              >
                <VerdictIcon verdict={item.verdict} />
                {strings.verdict[item.verdict]}
              </span>
              {segment && (
                <span className="fs-body font-semibold text-ink-900">“{segment.text}”</span>
              )}
            </div>
            <p className="mt-2 fs-body leading-relaxed text-ink-700">{note}</p>
          </li>
        )
      })}
    </ul>
  )
}

import { strings } from '@/content/strings/id'
import type { ScoreResult } from '@/domain/types'
import { formatScore } from '@/utils/date'
import { BadgeDisplay } from './BadgeDisplay'
import { ScoreGauge } from './ScoreGauge'

export interface ResultSummaryProps {
  result: ScoreResult
  hintUsed?: boolean
  caption?: string
}

function MetricBar({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="fs-body font-bold text-ink-800">{label}</span>
        <span className="fs-body font-extrabold tabular-nums text-ink-900">
          {formatScore(value)}
        </span>
      </div>
      <div
        className="mt-1 h-3 w-full overflow-hidden rounded-full bg-ink-100"
        role="img"
        aria-label={`${label}: ${value}`}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-700"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="mt-1 fs-body leading-relaxed text-ink-600">{description}</p>
    </div>
  )
}

/**
 * Rincian skor privasi & kegunaan — ringkas, dipajang di dalam accordion
 * halaman hasil supaya layar utama tidak padat.
 */
export function ScoreMetrics({ result }: { result: ScoreResult }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <MetricBar
        label={strings.result.privacy}
        value={result.privacyScore}
        description={strings.result.privacyExplain}
      />
      <MetricBar
        label={strings.result.utility}
        value={result.utilityScore}
        description={strings.result.utilityExplain}
      />
    </div>
  )
}

/** Layar utama hasil: skor besar, lencana, dan catatan petunjuk — satu layar, satu tujuan. */
export function ResultSummary({ result, hintUsed, caption }: ResultSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
      <ScoreGauge value={result.total} label={strings.result.total} caption={caption} />

      <div className="grid gap-4">
        <BadgeDisplay badge={result.badge} />
        {hintUsed ? (
          <p
            role="status"
            className="rounded-xl bg-amber-50 px-4 py-3 fs-body leading-relaxed text-amber-800"
          >
            {strings.result.hintPenalty}{' '}
            <span className="font-bold">({strings.result.usedHint})</span>
          </p>
        ) : (
          <p className="fs-body leading-relaxed text-ink-600">{strings.result.noHint}</p>
        )}
      </div>
    </div>
  )
}

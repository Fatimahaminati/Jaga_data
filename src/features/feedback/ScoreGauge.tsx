import { strings } from '@/content/strings/id'
import { cx } from '@/utils/cx'

export interface ScoreGaugeProps {
  value: number
  label: string
  caption?: string
}

const SIZE = 148
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function toneFor(value: number): string {
  if (value >= 80) return 'stroke-brand-500'
  if (value >= 50) return 'stroke-amber-500'
  return 'stroke-accent-500'
}

/** Gauge skor berbasis SVG — tanpa pustaka grafis. */
export function ScoreGauge({ value, label, caption }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${label}: ${clamped}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-ink-100"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cx('transition-[stroke-dashoffset] duration-700', toneFor(clamped))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="fs-score font-extrabold tabular-nums text-ink-900">{clamped}</span>
          <span className="fs-small font-bold uppercase tracking-wide text-ink-500">
            {strings.result.total}
          </span>
        </div>
      </div>
      {caption && <p className="fs-body text-ink-600">{caption}</p>}
    </div>
  )
}

import { strings } from '@/content/strings/id'

export interface ScorePoint {
  label: string
  value: number
}

const WIDTH = 320
const HEIGHT = 130
const PAD_X = 18
const PAD_TOP = 12
const PAD_BOTTOM = 22

/** Grafik perkembangan skor sederhana berbasis SVG (tanpa pustaka grafis). */
export function ScoreChart({ points }: { points: ScorePoint[] }) {
  if (points.length === 0) return null

  const innerWidth = WIDTH - PAD_X * 2
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0

  const x = (index: number) => PAD_X + index * step
  const y = (value: number) => PAD_TOP + innerHeight - (value / 100) * innerHeight

  const path = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')

  return (
    <figure className="surface p-4">
      <figcaption className="sr-only">{strings.history.chartTitle}</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={strings.history.chartDescription}
      >
        {[0, 50, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-ink-200"
              strokeDasharray="3 4"
            />
            <text x={4} y={y(tick) + 4} className="fill-ink-500 fs-chart">
              {tick}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <polyline points={path} fill="none" className="stroke-brand-500" strokeWidth="2.5" />
        )}

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={x(index)} cy={y(point.value)} r="4" className="fill-brand-600" />
            <text
              x={x(index)}
              y={y(point.value) - 8}
              textAnchor="middle"
              className="fill-ink-700 fs-chart font-bold"
            >
              {point.value}
            </text>
            {points.length <= 8 && (
              <text
                x={x(index)}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-ink-500 fs-chart"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}

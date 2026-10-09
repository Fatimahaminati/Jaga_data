import { Eye, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import type { Attempt } from '@/domain/types'
import { formatDateTime, formatScore } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'

export interface HistoryListProps {
  attempts: Attempt[]
  titleOf: (scenarioId: string) => string
  bestByScenario: Record<string, number>
  onDelete: (id: string) => void
}

/**
 * Daftar kartu riwayat — satu percobaan satu kartu.
 * Menggantikan tabel lebar: tanggal, skenario, skor, lencana, lalu aksi lihat/hapus.
 */
export function HistoryList({ attempts, titleOf, bestByScenario, onDelete }: HistoryListProps) {
  return (
    <ul aria-label={strings.history.listLabel} className="grid gap-4">
      {attempts.map((attempt, index) => {
        const name = titleOf(attempt.scenarioId)
        const isBest = bestByScenario[attempt.scenarioId] === attempt.result.total

        return (
          <li
            key={attempt.id}
            className="surface flex flex-wrap items-start justify-between gap-x-6 gap-y-4 p-6"
          >
            <div className="grid gap-1">
              <span className="label-caps">{strings.history.dateLabel}</span>
              <span className="fs-body font-semibold text-ink-900">
                {formatDateTime(attempt.createdAt)}
              </span>
              <span className="fs-body text-ink-500">
                {strings.history.attempt(attempts.length - index)}
              </span>
            </div>

            <div className="grid gap-1">
              <span className="label-caps">{strings.history.scenarioLabel}</span>
              <span className="fs-body font-bold text-ink-900">{name}</span>
              {isBest && <Pill tone="brand">{strings.history.bestBadge}</Pill>}
            </div>

            <div className="grid gap-1">
              <span className="label-caps">{strings.history.scoreLabel}</span>
              <span className="flex flex-wrap items-center gap-3">
                <span className="fs-h1 font-extrabold tabular-nums text-ink-900">
                  {formatScore(attempt.result.total)}
                </span>
                <Pill tone={attempt.result.badge === 'penjaga_data' ? 'brand' : 'neutral'}>
                  {strings.badge[attempt.result.badge].label}
                </Pill>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/hasil/${attempt.id}`} className="btn btn-secondary">
                <Eye size={18} aria-hidden />
                {strings.history.view}
              </Link>
              <Button
                variant="ghost"
                icon={<Trash2 size={18} aria-hidden />}
                onClick={() => onDelete(attempt.id)}
                aria-label={`${strings.history.delete}: ${name}`}
              >
                {strings.history.delete}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

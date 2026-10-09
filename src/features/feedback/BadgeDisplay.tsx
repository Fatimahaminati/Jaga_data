import { ShieldCheck, Sprout, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import type { Badge } from '@/domain/types'
import { cx } from '@/utils/cx'

const ICONS: Record<Badge, ReactNode> = {
  pemula: <Sprout size={22} aria-hidden />,
  waspada: <TriangleAlert size={22} aria-hidden />,
  penjaga_data: <ShieldCheck size={22} aria-hidden />,
}

const TONES: Record<Badge, string> = {
  pemula: 'bg-ink-100 text-ink-700',
  waspada: 'bg-amber-100 text-amber-800',
  penjaga_data: 'bg-brand-100 text-brand-800',
}

export function BadgeDisplay({ badge, className }: { badge: Badge; className?: string }) {
  const copy = strings.badge[badge]

  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3',
        className,
      )}
    >
      <span className={cx('flex h-11 w-11 items-center justify-center rounded-xl', TONES[badge])}>
        {ICONS[badge]}
      </span>
      <span>
        <span className="block fs-small font-bold uppercase tracking-wide text-ink-500">
          {strings.result.badgeLabel}
        </span>
        <span className="block fs-body font-extrabold text-ink-900">{copy.label}</span>
        <span className="block fs-body leading-relaxed text-ink-600">{copy.description}</span>
      </span>
    </div>
  )
}

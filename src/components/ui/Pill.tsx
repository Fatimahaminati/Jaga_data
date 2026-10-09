import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'

export type PillTone = 'brand' | 'accent' | 'neutral' | 'amber'

const TONES: Record<PillTone, string> = {
  brand: 'bg-brand-100 text-brand-800',
  accent: 'bg-accent-100 text-accent-800',
  neutral: 'bg-ink-100 text-ink-700',
  amber: 'bg-amber-100 text-amber-800',
}

export function Pill({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: PillTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cx('pill', TONES[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

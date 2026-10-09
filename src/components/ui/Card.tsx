import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/cx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cx('surface', className)} {...rest}>
      {children}
    </div>
  )
}

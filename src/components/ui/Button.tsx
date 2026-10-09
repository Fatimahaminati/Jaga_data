import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'btn',
        `btn-${variant}`,
        size === 'lg' && 'btn-lg',
        size === 'sm' && 'btn-sm',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

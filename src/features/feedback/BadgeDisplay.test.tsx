import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import type { Badge } from '@/domain/types'
import { BadgeDisplay } from './BadgeDisplay'

describe('BadgeDisplay', () => {
  const badges: Badge[] = ['pemula', 'waspada', 'penjaga_data']

  it('menampilkan label dan deskripsi setiap lencana', () => {
    badges.forEach((badge) => {
      const { unmount } = render(<BadgeDisplay badge={badge} />)

      expect(screen.getByText(strings.badge[badge].label)).toBeInTheDocument()
      expect(screen.getByText(strings.badge[badge].description)).toBeInTheDocument()
      expect(screen.getByText(strings.result.badgeLabel)).toBeInTheDocument()
      unmount()
    })
  })

  it('memilih ikon dan warna tone sesuai lencana', () => {
    const { container } = render(<BadgeDisplay badge="penjaga_data" />)

    expect(container.querySelector('.lucide-shield-check')).not.toBeNull()
    expect(container.querySelector('.bg-brand-100')).not.toBeNull()
  })

  it('menggabungkan kelas tambahan', () => {
    render(<BadgeDisplay badge="pemula" className="md:hidden" />)
    expect(screen.getByText(strings.badge.pemula.label).closest('div')).toHaveClass('md:hidden')
  })
})

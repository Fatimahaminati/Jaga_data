import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import { Pill } from './Pill'

describe('Pill', () => {
  it('memakai tone netral secara bawaan', () => {
    render(<Pill>{strings.history.bestBadge}</Pill>)

    const pill = screen.getByText(strings.history.bestBadge)
    expect(pill).toHaveClass('pill', 'bg-ink-100', 'text-ink-700')
  })

  it('memetakan setiap tone ke kelas warnanya', () => {
    const tones = {
      brand: ['bg-brand-100', 'text-brand-800'],
      accent: ['bg-accent-100', 'text-accent-800'],
      neutral: ['bg-ink-100', 'text-ink-700'],
      amber: ['bg-amber-100', 'text-amber-800'],
    } as const

    Object.entries(tones).forEach(([tone, classes], index) => {
      const label = `${strings.verdict.correct}-${index}`
      const { unmount } = render(<Pill tone={tone as keyof typeof tones}>{label}</Pill>)
      const pill = screen.getByText(label)
      classes.forEach((className) => expect(pill).toHaveClass(className))
      unmount()
    })
  })

  it('merender ikon opsional bersama teks', () => {
    render(
      <Pill tone="amber" icon={<span data-testid="ikon-amber" />}>
        {strings.practice.hintBadge}
      </Pill>,
    )

    expect(screen.getByTestId('ikon-amber')).toBeInTheDocument()
    expect(screen.getByText(strings.practice.hintBadge)).toBeInTheDocument()
  })

  it('menggabungkan kelas tambahan', () => {
    render(<Pill className="mt-2">{strings.scenarios.start}</Pill>)
    expect(screen.getByText(strings.scenarios.start)).toHaveClass('pill', 'mt-2')
  })
})

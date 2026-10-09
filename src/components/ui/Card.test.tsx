import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import { Card } from './Card'

describe('Card', () => {
  it('merender anak komponen di dalam permukaan', () => {
    render(
      <Card>
        <p>{strings.home.privacyTitle}</p>
      </Card>,
    )

    expect(screen.getByText(strings.home.privacyTitle)).toBeInTheDocument()
  })

  it('menggabungkan kelas bawaan dengan kelas tambahan', () => {
    render(<Card className="p-8">{strings.common.loading}</Card>)

    const card = screen.getByText(strings.common.loading)
    expect(card).toHaveClass('surface', 'p-8')
  })

  it('meneruskan atribut lain ke elemen pembungkus', () => {
    render(
      <Card role="region" aria-label={strings.result.summaryTitle} data-lebar="penuh">
        {strings.result.title}
      </Card>,
    )

    const card = screen.getByRole('region', { name: strings.result.summaryTitle })
    expect(card).toHaveAttribute('data-lebar', 'penuh')
  })
})

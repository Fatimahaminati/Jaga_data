import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import { ScoreGauge } from './ScoreGauge'

function classesOfCircle(container: HTMLElement, index: number): string {
  const circle = container.querySelectorAll('circle')[index]
  return circle?.getAttribute('class') ?? ''
}

describe('ScoreGauge', () => {
  it('merender gauge SVG dengan label akses dan nilai', () => {
    const { container } = render(
      <ScoreGauge value={85} label={strings.result.total} caption={strings.result.usedHint} />,
    )

    const gauge = screen.getByRole('img', { name: `${strings.result.total}: 85` })
    expect(gauge).toHaveAttribute('aria-label', `${strings.result.total}: 85`)
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText(strings.result.total)).toBeInTheDocument()
    expect(screen.getByText(strings.result.usedHint)).toBeInTheDocument()
  })

  it('membatasi nilai ke rentang 0..100', () => {
    const { container: high } = render(<ScoreGauge value={130} label={strings.result.total} />)
    expect(screen.getByRole('img', { name: `${strings.result.total}: 100` })).toBeInTheDocument()
    expect(high).toHaveTextContent('100')

    const { container: low } = render(<ScoreGauge value={-20} label={strings.result.total} />)
    expect(screen.getByRole('img', { name: `${strings.result.total}: 0` })).toBeInTheDocument()
    expect(low).toHaveTextContent('0')
  })

  it('memilih warna tegangan berdasarkan nilai', () => {
    const { container: strong, unmount } = render(
      <ScoreGauge value={90} label={strings.result.total} />,
    )
    expect(classesOfCircle(strong, 1)).toContain('stroke-brand-500')
    unmount()

    const { container: mid, unmount: unmountMid } = render(
      <ScoreGauge value={60} label={strings.result.total} />,
    )
    expect(classesOfCircle(mid, 1)).toContain('stroke-amber-500')
    unmountMid()

    const { container: weak } = render(<ScoreGauge value={20} label={strings.result.total} />)
    expect(classesOfCircle(weak, 1)).toContain('stroke-accent-500')
  })

  it('menyembunyikan caption bila tidak diisi', () => {
    render(<ScoreGauge value={50} label={strings.result.total} />)
    expect(screen.getByRole('img', { name: `${strings.result.total}: 50` })).toBeInTheDocument()
    expect(screen.queryByText(strings.result.usedHint)).not.toBeInTheDocument()
  })
})

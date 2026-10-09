import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import { ScoreChart, type ScorePoint } from './ScoreChart'

function points(count: number): ScorePoint[] {
  return Array.from({ length: count }, (_, index) => ({
    label: `P${index + 1}`,
    value: 40 + index * 7,
  }))
}

describe('ScoreChart', () => {
  it('tidak merender apa pun bila tidak ada titik skor', () => {
    const { container } = render(<ScoreChart points={[]} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText(strings.history.chartTitle)).not.toBeInTheDocument()
  })

  it('menampilkan judul dan grafik berlabel untuk satu titik', () => {
    const single = [points(1)[0]]
    const { container } = render(<ScoreChart points={single} />)

    expect(screen.getByText(strings.history.chartTitle)).toBeInTheDocument()

    const svg = screen.getByRole('img', { name: strings.history.chartDescription })
    expect(svg).toHaveAttribute('viewBox', '0 0 320 130')

    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(container.querySelector('polyline')).toBeNull()
    expect(screen.getByText(single[0].label)).toBeInTheDocument()
    expect(screen.getByText(String(single[0].value))).toBeInTheDocument()
  })

  it('menggambar garis, titik, tick sumbu, dan label sumbu-x', () => {
    const data = points(5)
    const { container } = render(<ScoreChart points={data} />)

    expect(container.querySelectorAll('circle')).toHaveLength(data.length)
    expect(container.querySelector('polyline')).not.toBeNull()

    // Tick tetap 0, 50, dan 100.
    expect(container.querySelectorAll('line')).toHaveLength(3)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()

    data.forEach((point) => {
      expect(screen.getByText(point.label)).toBeInTheDocument()
      expect(screen.getByText(String(point.value))).toBeInTheDocument()
    })
  })

  it('menyembunyikan label sumbu-x bila titik lebih dari delapan', () => {
    const data = points(9)
    const { container } = render(<ScoreChart points={data} />)

    expect(container.querySelectorAll('circle')).toHaveLength(data.length)
    expect(container.querySelector('polyline')).not.toBeNull()

    expect(screen.queryByText(data[0].label)).not.toBeInTheDocument()
    expect(screen.getByText(String(data[0].value))).toBeInTheDocument()
    expect(screen.getByText(strings.history.chartTitle)).toBeInTheDocument()
  })
})

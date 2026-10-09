import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { formatScore } from '@/utils/date'
import { ScenarioCard } from './ScenarioCard'

const scenario = scenarios[0]

/** Kalimat pertama dari situasi skenario — sama seperti yang ditampilkan kartu. */
const summary = scenario.context.match(/^[^.!?]*[.!?]/)?.[0].trim() ?? scenario.context

function renderCard(props: Partial<Parameters<typeof ScenarioCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ScenarioCard scenario={scenario} bestScore={null} attempts={0} hasDraft={false} {...props} />
    </MemoryRouter>,
  )
}

describe('ScenarioCard', () => {
  it('menampilkan ikon, judul, dan ringkasan satu kalimat tanpa tujuan belajar', () => {
    renderCard()

    const title = screen.getByRole('heading', { level: 2, name: scenario.title })
    expect(title).toBeInTheDocument()
    expect(title.parentElement?.querySelector('svg')).not.toBeNull()
    expect(screen.getByText(summary)).toBeInTheDocument()

    expect(screen.queryByText(strings.scenarios.objectives)).toBeNull()
    scenario.learningObjectives.forEach((objective) => {
      expect(screen.queryByText(objective)).toBeNull()
    })
  })

  it('menampilkan pill tingkat kesulitan dan jumlah potongan pesan', () => {
    renderCard()

    const difficulty = `${strings.scenarios.difficultyLabel}: ${strings.scenarios.difficulty[scenario.difficulty]}`
    expect(screen.getByText(difficulty)).toBeInTheDocument()
    expect(
      screen.getByText(`${scenario.segments.length} ${strings.scenarios.segmentCount}`),
    ).toBeInTheDocument()
    expect(screen.queryByText(strings.home.resumeDraft)).not.toBeInTheDocument()
  })

  it('menampilkan status belum pernah dicoba dan tombol Mulai', () => {
    renderCard()

    expect(screen.getByText(strings.scenarios.notAttempted)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: new RegExp(strings.scenarios.start) })
    expect(link).toHaveAttribute('href', `/latihan/${scenario.id}`)
    expect(link).toHaveTextContent(strings.scenarios.start)
  })

  it('menampilkan skor terbaik dan tombol Lanjutkan bila sudah pernah dicoba', () => {
    renderCard({ bestScore: 85, attempts: 2 })

    const stat = screen.getByText(new RegExp(strings.scenarios.bestScore))
    expect(stat).toHaveTextContent(formatScore(85))
    expect(stat).toHaveTextContent(`2 ${strings.scenarios.attempts}`)
    expect(screen.queryByText(strings.scenarios.notAttempted)).not.toBeInTheDocument()

    const link = screen.getByRole('link', { name: new RegExp(strings.scenarios.continue) })
    expect(link).toHaveAttribute('href', `/latihan/${scenario.id}`)
  })

  it('menampilkan penanda draf yang belum selesai', () => {
    renderCard({ hasDraft: true })
    expect(screen.getByText(strings.home.resumeDraft)).toBeInTheDocument()
  })
})

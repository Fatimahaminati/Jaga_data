import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { score } from '@/domain/scoring/engine'
import type { Decision } from '@/domain/types'
import { ResultSummary, ScoreMetrics } from './ResultSummary'

const scenario = scenarios[0]

function keepAll(): Decision[] {
  return scenario.segments.map((segment) => ({ segmentId: segment.id, action: 'keep' as const }))
}

describe('ResultSummary', () => {
  it('menampilkan gauge total, nama skenario, dan lencana hasil', () => {
    const result = score(scenario, keepAll())
    render(<ResultSummary result={result} caption={scenario.title} />)

    expect(
      screen.getByRole('img', { name: `${strings.result.total}: ${result.total}` }),
    ).toBeInTheDocument()
    expect(screen.getByText(scenario.title)).toBeInTheDocument()

    expect(screen.getByText(strings.badge[result.badge].label)).toBeInTheDocument()
    expect(screen.getByText(strings.result.badgeLabel)).toBeInTheDocument()
    // Kalimat ringkasan satu baris ikut tampil bersama lencana.
    expect(screen.getByText(strings.badge[result.badge].description)).toBeInTheDocument()
  })

  it('menampilkan catatan penalti petunjuk bila hint dipakai', () => {
    const result = score(scenario, keepAll())
    render(<ResultSummary result={result} hintUsed />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(strings.result.hintPenalty)
    expect(status).toHaveTextContent(strings.result.usedHint)
  })

  it('tanpa petunjuk tidak ada catatan penalti', () => {
    const result = score(scenario, keepAll())
    render(<ResultSummary result={result} hintUsed={false} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText(new RegExp(strings.result.hintPenalty))).not.toBeInTheDocument()
    expect(screen.getByText(strings.result.noHint)).toBeInTheDocument()
  })
})

describe('ScoreMetrics', () => {
  it('menampilkan batang skor privasi serta kegunaan dan penjelasannya', () => {
    const result = score(scenario, keepAll())
    render(<ScoreMetrics result={result} />)

    expect(
      screen.getByRole('img', { name: `${strings.result.privacy}: ${result.privacyScore}` }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: `${strings.result.utility}: ${result.utilityScore}` }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.result.privacyExplain)).toBeInTheDocument()
    expect(screen.getByText(strings.result.utilityExplain)).toBeInTheDocument()
    expect(screen.getByText(strings.result.privacy)).toBeInTheDocument()
    expect(screen.getByText(strings.result.utility)).toBeInTheDocument()
  })
})

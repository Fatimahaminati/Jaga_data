import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { score } from '@/domain/scoring/engine'
import type { Attempt } from '@/domain/types'
import { formatDateTime, formatScore } from '@/utils/date'
import { HistoryList } from './HistoryList'

const scenario = scenarios[0]
const titleOf = (scenarioId: string) => (scenarioId === scenario.id ? scenario.title : scenarioId)

const latestResult = score(scenario, [])
const olderResult = score(scenario, [
  {
    segmentId: scenario.segments[0].id,
    action: 'generalize',
    optionId: scenario.segments[0].options[0].id,
  },
])

const attempts: Attempt[] = [
  {
    id: 'percobaan-2',
    scenarioId: scenario.id,
    decisions: [],
    result: latestResult,
    createdAt: '2026-03-04T09:30:00.000Z',
    durationMs: 60_000,
    hintUsed: false,
  },
  {
    id: 'percobaan-1',
    scenarioId: scenario.id,
    decisions: [],
    result: olderResult,
    createdAt: '2026-03-01T09:30:00.000Z',
    durationMs: 75_000,
    hintUsed: true,
  },
]

const bestByScenario = {
  [scenario.id]: Math.max(latestResult.total, olderResult.total),
}

function setup(props?: { onDelete?: (id: string) => void; list?: Attempt[] }) {
  const onDelete = props?.onDelete ?? vi.fn()
  const utils = render(
    <MemoryRouter>
      <HistoryList
        attempts={props?.list ?? attempts}
        titleOf={titleOf}
        bestByScenario={bestByScenario}
        onDelete={onDelete}
      />
    </MemoryRouter>,
  )
  return { ...utils, onDelete }
}

describe('HistoryList', () => {
  it('menampilkan daftar percobaan berlabel aksesibel', () => {
    setup()

    const list = screen.getByRole('list', { name: strings.history.listLabel })
    expect(list).toBeInTheDocument()
    expect(within(list).getAllByRole('listitem')).toHaveLength(attempts.length)
  })

  it('menampilkan waktu, skenario, skor, dan lencana tiap percobaan', () => {
    setup()

    const items = screen.getByRole('list', { name: strings.history.listLabel })
    const cards = within(items).getAllByRole('listitem')

    cards.forEach((card, index) => {
      const attempt = attempts[index]

      expect(within(card).getByText(formatDateTime(attempt.createdAt))).toBeInTheDocument()
      expect(
        within(card).getByText(strings.history.attempt(attempts.length - index)),
      ).toBeInTheDocument()
      expect(within(card).getByText(titleOf(attempt.scenarioId))).toBeInTheDocument()
      expect(within(card).getByText(formatScore(attempt.result.total))).toBeInTheDocument()
      expect(within(card).getByText(strings.badge[attempt.result.badge].label)).toBeInTheDocument()
    })
  })

  it('menandai percobaan dengan skor terbaik per skenario', () => {
    setup()

    const cards = screen.getAllByRole('listitem')
    const bestIndex = attempts.findIndex(
      (attempt) => attempt.result.total === bestByScenario[attempt.scenarioId],
    )

    cards.forEach((card, index) => {
      const badge = within(card).queryByText(strings.history.bestBadge)
      if (index === bestIndex) {
        expect(badge).toBeInTheDocument()
      } else {
        expect(badge).not.toBeInTheDocument()
      }
    })
  })

  it('menautkan setiap kartu ke halaman hasil', () => {
    setup()

    const links = screen.getAllByRole('link', { name: strings.history.view })
    expect(links).toHaveLength(attempts.length)
    expect(links[0]).toHaveAttribute('href', `/hasil/${attempts[0].id}`)
    expect(links[1]).toHaveAttribute('href', `/hasil/${attempts[1].id}`)
  })

  it('mengirim id percobaan saat tombol hapus diklik', async () => {
    const user = userEvent.setup()
    const { onDelete } = setup()

    const buttons = screen.getAllByRole('button', {
      name: new RegExp(`^${strings.history.delete}`),
    })
    expect(buttons).toHaveLength(attempts.length)

    await user.click(buttons[1])
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(attempts[1].id)
  })

  it('menggunakan lencana netral untuk skor di bawah penjaga data', () => {
    const list: Attempt[] = [
      {
        ...attempts[1],
        id: 'percobaan-3',
        result: { ...olderResult, total: 0, privacyScore: 0, utilityScore: 0, badge: 'pemula' },
      },
    ]
    setup({ list })

    const [card] = screen.getAllByRole('listitem')
    expect(within(card).getByText(strings.badge.pemula.label)).toBeInTheDocument()
    expect(within(card).queryByText(strings.history.bestBadge)).not.toBeInTheDocument()
  })

  it('merender daftar kosong tanpa kartu bila riwayat kosong', () => {
    setup({ list: [] })

    const list = screen.getByRole('list', { name: strings.history.listLabel })
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.queryByRole('link', { name: strings.history.view })).not.toBeInTheDocument()
  })
})

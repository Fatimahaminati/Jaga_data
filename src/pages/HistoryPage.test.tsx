import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import type { Attempt, ScoreResult } from '@/domain/types'
import { downloadBlob } from '@/infra/export/download'
import { useProgressStore } from '@/stores/progressStore'
import HistoryPage from './HistoryPage'

vi.mock('@/infra/export/download', () => ({
  downloadBlob: vi.fn(),
  fileStamp: vi.fn(() => '2026-01-02_15-04'),
  safeFilename: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
}))

function makeResult(total: number): ScoreResult {
  return {
    total,
    privacyScore: total,
    utilityScore: total,
    perSegment: [],
    badge: total >= 80 ? 'penjaga_data' : 'pemula',
  }
}

function makeAttempt(id: string, scenarioId: string, total: number): Attempt {
  return {
    id,
    scenarioId,
    decisions: [],
    result: makeResult(total),
    createdAt: '2026-01-02T03:04:05.000Z',
    durationMs: 45_000,
    hintUsed: false,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/riwayat']}>
      <Routes>
        <Route path="/riwayat" element={<HistoryPage />} />
        <Route path="/skenario" element={<p>DAFTAR SKENARIO</p>} />
        <Route path="/hasil/:attemptId" element={<p>HALAMAN HASIL</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function statValue(label: string): string {
  const term = screen.getByText(label)
  return term.nextElementSibling?.textContent ?? ''
}

async function expandChart(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  const heading = screen.getByRole('heading', { level: 2, name: strings.history.chartTitle })
  const section = heading.closest('section')
  if (!section) throw new Error('section grafik tidak ditemukan')
  const button = within(section).getByRole('button', { name: strings.common.showMore })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  await user.click(button)
  return section
}

beforeEach(() => {
  window.localStorage.clear()
  useProgressStore.setState({ attempts: [] })
  vi.mocked(downloadBlob).mockClear()
})

describe('HistoryPage — kondisi kosong', () => {
  it('menampilkan pesan bila belum ada percobaan', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: strings.history.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.history.emptyTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.history.emptyBody)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: strings.history.emptyTitle })).toBeInTheDocument()
  })

  it('menautkan ke daftar skenario untuk memulai latihan pertama', async () => {
    const user = userEvent.setup()
    renderPage()

    const link = screen.getByRole('link', { name: strings.history.startFirst })
    expect(link).toHaveAttribute('href', '/skenario')

    await user.click(link)
    expect(await screen.findByText('DAFTAR SKENARIO')).toBeInTheDocument()
  })

  it('tidak menampilkan grafik, daftar percobaan, maupun menu hapus', () => {
    renderPage()

    expect(screen.queryByRole('img', { name: strings.history.chartDescription })).toBeNull()
    expect(screen.queryByRole('list', { name: strings.history.listLabel })).toBeNull()
    expect(screen.queryByRole('button', { name: strings.history.deleteAll })).toBeNull()
  })
})

describe('HistoryPage — berisi percobaan', () => {
  it('menampilkan statistik jumlah, skor terbaik, rata-rata, dan skenario selesai', () => {
    useProgressStore.setState({
      attempts: [
        makeAttempt('att_1', 'perkenalan-diri', 80),
        makeAttempt('att_2', 'tugas-dan-curhat', 60),
      ],
    })

    renderPage()

    expect(statValue(strings.history.stats.attempts)).toBe('2')
    expect(statValue(strings.history.stats.best)).toContain('80')
    expect(statValue(strings.history.stats.average)).toBe('70')
    expect(statValue(strings.history.stats.scenariosDone)).toContain(`2 / ${scenarios.length}`)
  })

  it('menampilkan grafik perkembangan skor setelah accordion dibuka', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({
      attempts: [
        makeAttempt('att_1', 'perkenalan-diri', 80),
        makeAttempt('att_2', 'perkenalan-diri', 65),
      ],
    })

    renderPage()

    const section = await expandChart(user)

    expect(
      within(section).getByRole('img', { name: strings.history.chartDescription }),
    ).toBeInTheDocument()
    expect(within(section).getByText('80')).toBeInTheDocument()
    expect(within(section).getByText('65')).toBeInTheDocument()
  })

  it('menampilkan daftar percobaan dengan tautan lihat hasil', () => {
    useProgressStore.setState({
      attempts: [
        makeAttempt('att_1', 'perkenalan-diri', 80),
        makeAttempt('att_2', 'tugas-dan-curhat', 60),
      ],
    })

    renderPage()

    const list = screen.getByRole('list', { name: strings.history.listLabel })
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(within(list).getByText(scenarios[0].title)).toBeInTheDocument()
    expect(within(list).getByText(scenarios[1].title)).toBeInTheDocument()

    const view = within(list).getAllByRole('link', { name: new RegExp(strings.history.view) })
    expect(view).toHaveLength(2)
    expect(view[0]).toHaveAttribute('href', '/hasil/att_1')
    expect(within(list).getAllByText(strings.history.bestBadge)).toHaveLength(2)
  })

  it('memakai id mentah bila skenario percobaan tidak dikenal', () => {
    useProgressStore.setState({ attempts: [makeAttempt('att_1', 'skenario-hilang', 50)] })

    renderPage()

    expect(screen.getByText('skenario-hilang')).toBeInTheDocument()
    expect(
      screen.getByText(strings.history.stats.scenariosDone).nextElementSibling,
    ).toHaveTextContent(`1 / ${scenarios.length}`)
  })

  it('menghapus satu percobaan dari daftar', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({
      attempts: [
        makeAttempt('att_1', 'perkenalan-diri', 80),
        makeAttempt('att_2', 'tugas-dan-curhat', 60),
      ],
    })

    renderPage()
    await user.click(
      screen.getByRole('button', {
        name: `${strings.history.delete}: ${scenarios[0].title}`,
      }),
    )

    expect(useProgressStore.getState().attempts).toHaveLength(1)
    expect(useProgressStore.getState().attempts[0].id).toBe('att_2')
    expect(
      within(screen.getByRole('list', { name: strings.history.listLabel })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(1)
  })

  it('meminta konfirmasi dua langkah sebelum menghapus semua riwayat', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({ attempts: [makeAttempt('att_1', 'perkenalan-diri', 80)] })

    renderPage()
    const clearButton = screen.getByRole('button', { name: strings.history.deleteAll })

    await user.click(clearButton)

    expect(useProgressStore.getState().attempts).toHaveLength(1)
    expect(screen.getByText(strings.common.confirm)).toBeInTheDocument()
    expect(screen.getByText(strings.history.deleteTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.history.deleteBody)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: strings.history.deleteAll }))

    await waitFor(() => expect(useProgressStore.getState().attempts).toHaveLength(0))
    expect(await screen.findByText(strings.history.emptyTitle)).toBeInTheDocument()
    expect(await screen.findByText(strings.history.clearSuccess)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: strings.history.listLabel })).toBeNull()
  })
})

describe('HistoryPage — ekspor', () => {
  it('menyediakan ekspor CSV dan JSON saat ada data', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({ attempts: [makeAttempt('att_1', 'perkenalan-diri', 80)] })

    renderPage()
    expect(screen.getByRole('button', { name: strings.export.csv })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.export.json })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: strings.export.csv }))

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByText(strings.export.success('CSV riwayat ringkas')),
    ).toBeInTheDocument()
  })

  it('melaporkan kegagalan bila proses ekspor CSV melempar error', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({ attempts: [makeAttempt('att_1', 'perkenalan-diri', 80)] })
    vi.mocked(downloadBlob).mockImplementationOnce(() => {
      throw new Error('kuota penuh')
    })

    renderPage()
    await user.click(screen.getByRole('button', { name: strings.export.csv }))

    expect(await screen.findByText(strings.export.failed)).toBeInTheDocument()
  })
})

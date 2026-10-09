import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getScenario, nextScenario } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { score } from '@/domain/scoring/engine'
import type { Attempt, Decision, Verdict } from '@/domain/types'
import { exportPdf } from '@/infra/export/exportPdf'
import { exportPng } from '@/infra/export/exportPng'
import { downloadBlob } from '@/infra/export/download'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import ResultPage from './ResultPage'

vi.mock('@/infra/export/exportPdf', () => ({ exportPdf: vi.fn() }))
vi.mock('@/infra/export/exportPng', () => ({ exportPng: vi.fn() }))
vi.mock('@/infra/export/download', () => ({
  downloadBlob: vi.fn(),
  fileStamp: vi.fn(() => '2026-01-02_15-04'),
  safeFilename: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
}))

const firstScenario = getScenario('perkenalan-diri')
const lastScenario = getScenario('formulir-dan-percakapan')
if (!firstScenario || !lastScenario) throw new Error('skenario uji tidak ditemukan')

const PRIVACY_UTILITY_TITLE = strings.result.detailScoresTitle

function makeAttempt(
  id: string,
  scenarioId: string,
  options: { hintUsed?: boolean; decisions?: Decision[] } = {},
): Attempt {
  const scenario = getScenario(scenarioId)
  if (!scenario) throw new Error('skenario uji tidak ditemukan')
  const decisions = options.decisions ?? []
  return {
    id,
    scenarioId,
    decisions,
    result: score(scenario, decisions),
    createdAt: '2026-01-02T03:04:05.000Z',
    durationMs: 65_000,
    hintUsed: options.hintUsed ?? false,
  }
}

function renderPage(attemptId: string) {
  return render(
    <MemoryRouter initialEntries={[`/hasil/${attemptId}`]}>
      <Routes>
        <Route path="/hasil/:attemptId" element={<ResultPage />} />
        <Route path="/latihan/:scenarioId" element={<p>HALAMAN LATIHAN</p>} />
        <Route path="/riwayat" element={<p>HALAMAN RIWAYAT</p>} />
        <Route path="/skenario" element={<p>DAFTAR SKENARIO</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function sectionFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title })
  const section = heading.closest('section')
  if (!section) throw new Error(`section untuk "${title}" tidak ditemukan`)
  return section
}

async function expand(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
): Promise<HTMLElement> {
  const section = sectionFor(title)
  const button = within(section).getByRole('button', { name: strings.common.showMore })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  await user.click(button)
  expect(within(section).getByRole('button', { name: strings.common.showLess })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  return section
}

beforeEach(() => {
  window.localStorage.clear()
  useProgressStore.setState({ attempts: [] })
  useSessionStore.getState().clear()
  useSettingsStore.setState({ nickname: '', fontScale: 'normal' })
  vi.mocked(exportPdf).mockClear()
  vi.mocked(exportPng).mockClear()
  vi.mocked(downloadBlob).mockClear()
})

describe('ResultPage — menampilkan hasil', () => {
  it('menampilkan judul hasil, skor total, dan metadata percobaan', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: strings.result.scoreFor(firstScenario.title),
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: `${strings.result.total}: ${attempt.result.total}` }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Hasil tersimpan di perangkat ini/)).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
    expect(screen.getByText(/1 menit 5 detik/)).toBeInTheDocument()
  })

  it('menampilkan lencana beserta satu kalimat ringkasan', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(screen.getByText(strings.result.badgeLabel)).toBeInTheDocument()
    expect(screen.getByText(strings.badge[attempt.result.badge].label)).toBeInTheDocument()
    expect(screen.getByText(strings.badge[attempt.result.badge].description)).toBeInTheDocument()
  })

  it('menampilkan skor privasi dan kegunaan setelah accordion dibuka', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const section = await expand(user, PRIVACY_UTILITY_TITLE)

    expect(
      within(section).getByRole('img', {
        name: `${strings.result.privacy}: ${attempt.result.privacyScore}`,
      }),
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('img', {
        name: `${strings.result.utility}: ${attempt.result.utilityScore}`,
      }),
    ).toBeInTheDocument()
    expect(within(section).getByText(strings.result.privacyExplain)).toBeInTheDocument()
    expect(within(section).getByText(strings.result.utilityExplain)).toBeInTheDocument()
  })

  it('menampilkan paling banyak 3 hal terburuk untuk diperbaiki', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const section = sectionFor(strings.result.topTitle)
    const items = within(section).getAllByRole('listitem')
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(3)

    // Semua segmen keliru: item teratas memakai verdict keliru dulu.
    expect(within(items[0]).getByText(strings.verdict.wrong)).toBeInTheDocument()
    items.forEach((item) => {
      expect(item.textContent?.trim().length).toBeGreaterThan(0)
    })
  })

  it('menampilkan pesan bila tidak ada yang perlu diperbaiki', () => {
    const base = makeAttempt('att_hasil', 'perkenalan-diri')
    const attempt: Attempt = {
      ...base,
      result: {
        ...base.result,
        perSegment: base.result.perSegment.map((item) => ({
          ...item,
          verdict: 'correct' as Verdict,
        })),
      },
    }
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(screen.getByText(strings.result.topEmpty)).toBeInTheDocument()
  })

  it('menyembunyikan umpan balik tiap segmen sampai accordion dibuka', async () => {
    const user = userEvent.setup()
    const decisions: Decision[] = [{ segmentId: 's1-03', action: 'keep' }]
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri', { decisions })
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const section = sectionFor(strings.result.perSegmentTitle)
    expect(within(section).queryByRole('listitem')).toBeNull()

    await expand(user, strings.result.perSegmentTitle)

    expect(within(section).getAllByRole('listitem')).toHaveLength(firstScenario.segments.length)

    const addressFeedback = firstScenario.segments[2].sensitive?.feedback.wrong
    expect(addressFeedback).toBeTruthy()
    expect(within(section).getByText(addressFeedback as string)).toBeInTheDocument()
    expect(within(section).getAllByText(strings.verdict.wrong).length).toBeGreaterThan(0)
  })

  it('membuka detail tiap segmen lewat keyboard', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const button = within(sectionFor(strings.result.perSegmentTitle)).getByRole('button', {
      name: strings.common.showMore,
    })
    button.focus()
    await user.keyboard('{Enter}')

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(
      within(sectionFor(strings.result.perSegmentTitle)).getAllByRole('listitem'),
    ).toHaveLength(firstScenario.segments.length)
  })

  it('memberi catatan pemakaian mode petunjuk', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri', { hintUsed: true })
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(screen.getByText(new RegExp(strings.result.hintPenalty))).toBeInTheDocument()
    expect(screen.getByText(`(${strings.result.usedHint})`)).toBeInTheDocument()
  })

  it('tanpa petunjuk hanya menampilkan catatan tanpa penalti', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri', { hintUsed: false })
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(screen.queryByText(new RegExp(strings.result.hintPenalty))).toBeNull()
    expect(screen.getByText(strings.result.noHint)).toBeInTheDocument()
  })
})

describe('ResultPage — tindakan', () => {
  it('hanya punya satu tombol utama', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    const { container } = renderPage(attempt.id)

    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
  })

  it('mengulang latihan: mereset sesi dan kembali ke latihan', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })
    useSessionStore.setState({ scenarioId: 'perkenalan-diri', hintUsed: true })

    renderPage(attempt.id)
    await user.click(screen.getByRole('button', { name: strings.common.retry }))

    expect(await screen.findByText('HALAMAN LATIHAN')).toBeInTheDocument()
    expect(useSessionStore.getState().scenarioId).toBeNull()
    expect(useSessionStore.getState().hintUsed).toBe(false)
  })

  it('menautkan ke skenario berikutnya bila masih ada', async () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const next = nextScenario(firstScenario.id)
    expect(next).toBeDefined()
    const link = screen.getByRole('link', { name: new RegExp(strings.result.nextScenario) })
    expect(link).toHaveAttribute('href', `/latihan/${next?.id}`)
    expect(link).toHaveClass('btn-primary')
  })

  it('menawarkan memilih skenario lain di skenario terakhir', () => {
    const attempt = makeAttempt('att_hasil', lastScenario.id)
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    expect(screen.getByRole('link', { name: strings.result.backToScenarios })).toHaveAttribute(
      'href',
      '/skenario',
    )
    expect(screen.queryByRole('link', { name: /Skenario berikutnya/ })).toBeNull()
  })

  it('menautkan ke riwayat lewat tombol sekunder', () => {
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)

    const link = screen.getByRole('link', { name: new RegExp(strings.result.viewHistory) })
    expect(link).toHaveAttribute('href', '/riwayat')
    expect(link).not.toHaveClass('btn-primary')
  })
})

describe('ResultPage — percobaan tidak ditemukan', () => {
  it('menampilkan pesan bila id percobaan tidak ada di riwayat', async () => {
    const user = userEvent.setup()
    useProgressStore.setState({ attempts: [makeAttempt('att_ada', 'perkenalan-diri')] })

    renderPage('att_tidak-ada')

    expect(await screen.findByText(strings.errors.attemptMissing)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: strings.nav.history })
    expect(link).toHaveAttribute('href', '/riwayat')

    await user.click(link)
    expect(await screen.findByText('HALAMAN RIWAYAT')).toBeInTheDocument()
  })

  it('menampilkan pesan yang sama bila riwayat kosong sama sekali', () => {
    renderPage('att_kosong')

    expect(screen.getByText(strings.errors.attemptMissing)).toBeInTheDocument()
  })
})

describe('ResultPage — ekspor', () => {
  it('mengekspor PDF dengan ringkasan hasil', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri', { hintUsed: true })
    useProgressStore.setState({ attempts: [attempt] })
    useSettingsStore.setState({ nickname: 'Budi' })

    renderPage(attempt.id)
    await user.click(screen.getByRole('button', { name: strings.export.pdf }))

    await waitFor(() => expect(exportPdf).toHaveBeenCalledTimes(1))
    expect(exportPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining(strings.app.name),
        subtitle: expect.stringContaining('Budi'),
        scores: expect.any(Array),
        feedback: expect.any(Array),
      }),
      'perkenalan-diri-hasil',
    )
    expect(await screen.findByText(strings.export.success('PDF ringkasan'))).toBeInTheDocument()
  })

  it('mengekspor PNG dari kartu hasil', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)
    await user.click(screen.getByRole('button', { name: strings.export.png }))

    await waitFor(() => expect(exportPng).toHaveBeenCalledTimes(1))
    expect(exportPng).toHaveBeenCalledWith(expect.any(HTMLElement), 'hasil-perkenalan-diri')
    expect(await screen.findByText(strings.export.success('PNG kartu hasil'))).toBeInTheDocument()
  })

  it('mengekspor JSON berisi data percobaan', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })

    renderPage(attempt.id)
    await user.click(screen.getByRole('button', { name: strings.export.json }))

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(strings.export.success('JSON data lengkap'))).toBeInTheDocument()
  })

  it('menampilkan pesan gagal bila proses ekspor melempar error', async () => {
    const user = userEvent.setup()
    const attempt = makeAttempt('att_hasil', 'perkenalan-diri')
    useProgressStore.setState({ attempts: [attempt] })
    vi.mocked(exportPdf).mockRejectedValueOnce(new Error('gagal'))

    renderPage(attempt.id)
    await user.click(screen.getByRole('button', { name: strings.export.pdf }))

    expect(await screen.findByText(strings.export.failed)).toBeInTheDocument()
  })
})

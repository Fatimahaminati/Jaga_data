import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getScenario } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import type { Decision, Scenario } from '@/domain/types'
import { draftKey, loadDraft } from '@/hooks/useAutosaveDraft'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import PracticePage from './PracticePage'

const found = getScenario('perkenalan-diri')
if (!found) throw new Error('skenario uji tidak ditemukan')
const scenario: Scenario = found

const TOTAL = scenario.segments.length
const GROUP_NAME = strings.practice.messageTitle

function renderPage(path = `/latihan/${scenario.id}`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/latihan/:scenarioId" element={<PracticePage />} />
        <Route path="/hasil/:attemptId" element={<p>HALAMAN HASIL</p>} />
        <Route path="/skenario" element={<p>DAFTAR SKENARIO</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Render lalu tunggu editor token tampil; klik tombol mulai bila pengantar tampil. */
async function renderReady(): Promise<HTMLElement> {
  renderPage()
  await waitFor(() => {
    const ready =
      screen.queryByRole('button', { name: strings.practice.introStart }) ??
      screen.queryByRole('group', { name: GROUP_NAME })
    if (!ready) throw new Error('menunggu layar siap')
  })
  const start = screen.queryByRole('button', { name: strings.practice.introStart })
  if (start) await userEvent.setup().click(start)
  return await screen.findByRole('group', { name: GROUP_NAME })
}

function triggerAt(group: HTMLElement, index: number): HTMLElement {
  return within(group).getAllByRole('button')[index]
}

function triggerName(segmentIndex: number, status: string): string {
  return `${strings.practice.segmentAria(scenario.segments[segmentIndex].text)} — ${status}`
}

const generalizePattern = new RegExp(`^${strings.action.generalize}`)

async function openPopover(
  user: ReturnType<typeof userEvent.setup>,
  group: HTMLElement,
  index: number,
): Promise<HTMLElement> {
  await user.click(triggerAt(group, index))
  return await screen.findByRole('dialog', { name: strings.a11y.popover })
}

async function pickAction(
  user: ReturnType<typeof userEvent.setup>,
  group: HTMLElement,
  index: number,
  buttonName: RegExp,
): Promise<void> {
  const popover = await openPopover(user, group, index)
  await user.click(within(popover).getByRole('button', { name: buttonName }))
}

function writeDraft(decisions: Decision[], hintUsed = false): void {
  localStorageRepo.write(draftKey(scenario.id), {
    scenarioId: scenario.id,
    decisions,
    hintUsed,
    updatedAt: new Date().toISOString(),
  })
}

beforeEach(() => {
  window.localStorage.clear()
  useSessionStore.getState().clear()
  useProgressStore.setState({ attempts: [] })
  useSettingsStore.setState({ nickname: '', fontScale: 'normal', hintsEnabled: true })
})

describe('PracticePage — layar pengantar', () => {
  it('menampilkan tur 3 langkah dan tujuan belajar sebelum editor', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: strings.practice.introTitle }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.practice.introLead)).toBeInTheDocument()
    strings.practice.introSteps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument()
    })
    expect(screen.getByText(strings.practice.introGoalsLabel)).toBeInTheDocument()
    scenario.learningObjectives.slice(0, 2).forEach((objective) => {
      expect(screen.getByText(objective)).toBeInTheDocument()
    })
    expect(screen.queryByText(scenario.learningObjectives[2])).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: GROUP_NAME })).toBeNull()

    await user.click(screen.getByRole('button', { name: strings.practice.introStart }))

    expect(screen.queryByText(strings.practice.introTitle)).toBeNull()
    expect(screen.getByRole('group', { name: GROUP_NAME })).toBeInTheDocument()
    expect(screen.getByText(strings.practice.instruction)).toBeInTheDocument()
  })
})

describe('PracticePage — menampilkan skenario', () => {
  it('memuat skenario lalu menampilkan situasi, tujuan, dan petunjuk pengerjaan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: strings.practice.introStart }))

    expect(screen.getByRole('heading', { level: 1, name: scenario.title })).toBeInTheDocument()
    expect(screen.getByText(scenario.context)).toBeInTheDocument()
    expect(screen.getByText(scenario.aiTaskGoal)).toBeInTheDocument()
    expect(screen.getByText(strings.practice.instruction)).toBeInTheDocument()
    expect(screen.getByText(strings.practice.backToScenarios)).toBeInTheDocument()
    expect(screen.getByText(strings.practice.draftSaved)).toBeInTheDocument()
    expect(useSessionStore.getState().scenarioId).toBe(scenario.id)
  })

  it('menampilkan status memuat selama sesi belum dimulai', () => {
    const realStart = useSessionStore.getState().startScenario
    useSessionStore.setState({ startScenario: () => undefined })

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent(strings.common.loading)

    useSessionStore.setState({ startScenario: realStart })
  })

  it('menampilkan pesan skenario tidak ditemukan untuk rute yang salah', async () => {
    renderPage('/latihan/skenario-ngawur')

    expect(await screen.findByText(strings.errors.scenarioMissing)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: strings.nav.scenarios })
    expect(link).toHaveAttribute('href', '/skenario')
  })

  it('menampilkan progres nol persen di awal', async () => {
    await renderReady()

    expect(screen.getByText(strings.practice.reviewedProgress(0, TOTAL))).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.practice.submit })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.practice.undo })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.practice.redo })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.practice.reset })).toBeDisabled()
  })

  it('menautkan kembali ke daftar skenario', async () => {
    const user = userEvent.setup()
    await renderReady()

    await user.click(screen.getByRole('link', { name: strings.practice.backToScenarios }))

    expect(screen.getByText('DAFTAR SKENARIO')).toBeInTheDocument()
  })

  it('menampilkan panel sebelum & sesudah lewat tab', async () => {
    const user = userEvent.setup()
    await renderReady()

    expect(screen.getByRole('region', { name: strings.preview.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: strings.preview.title })).toBeInTheDocument()

    const tablist = screen.getByRole('tablist', { name: strings.preview.title })
    expect(
      within(tablist).getByRole('tab', { name: strings.preview.tabBefore }),
    ).toBeInTheDocument()
    expect(within(tablist).getByRole('tab', { name: strings.preview.tabAfter })).toBeInTheDocument()
    expect(screen.getByLabelText(strings.preview.beforeAria)).toBeInTheDocument()

    await user.click(within(tablist).getByRole('tab', { name: strings.preview.tabAfter }))

    expect(screen.getByLabelText(strings.preview.afterAria)).toBeInTheDocument()
  })
})

describe('PracticePage — memilih tindakan', () => {
  it('membuka popover tindakan saat sebuah segmen diklik', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    const popover = await openPopover(user, group, 0)

    expect(within(popover).getByText(strings.action.title)).toBeInTheDocument()
    expect(within(popover).getByRole('button', { name: /^Pertahankan/ })).toBeInTheDocument()
    expect(within(popover).getByRole('button', { name: /^Hapus/ })).toBeInTheDocument()
    expect(within(popover).getByRole('button', { name: generalizePattern })).toBeInTheDocument()
    expect(within(popover).getByRole('button', { name: strings.common.close })).toBeInTheDocument()
  })

  it('menyimpan keputusan "hapus" dan memperbarui progres', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)

    const trigger = triggerAt(group, 0)
    expect(trigger).toHaveAttribute('data-decision', 'remove')
    expect(trigger).toHaveAttribute('aria-label', triggerName(0, strings.action.remove))
    expect(screen.getByText(strings.practice.reviewedProgress(1, TOTAL))).toBeInTheDocument()
    expect(screen.getByText(strings.practice.decisionCount(1))).toBeInTheDocument()
    expect(useSessionStore.getState().decisions).toEqual([
      { segmentId: scenario.segments[0].id, action: 'remove' },
    ])
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('menyimpan keputusan "pertahankan"', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Pertahankan/)

    expect(triggerAt(group, 0)).toHaveAttribute('data-decision', 'keep')
    expect(useSessionStore.getState().decisions[0]).toEqual({
      segmentId: scenario.segments[0].id,
      action: 'keep',
    })
  })

  it('memilih generalisasi beserta opsi penggantinya', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    const popover = await openPopover(user, group, 0)
    await user.click(within(popover).getByRole('button', { name: generalizePattern }))

    expect(within(popover).getByText(strings.action.chooseReplacement)).toBeInTheDocument()
    const option = scenario.segments[0].options[0]
    await user.click(within(popover).getByRole('button', { name: new RegExp(option.label) }))

    // Memilih opsi belum mengunci keputusan — siswa harus menekan "Pakai opsi ini".
    expect(useSessionStore.getState().decisions).toHaveLength(0)
    await user.click(within(popover).getByRole('button', { name: strings.action.useOption }))

    expect(triggerAt(group, 0)).toHaveAttribute('data-decision', 'generalize')
    expect(useSessionStore.getState().decisions[0]).toEqual({
      segmentId: scenario.segments[0].id,
      action: 'generalize',
      optionId: option.id,
    })
  })

  it('membatalkan pilihan lewat tombol di dalam popover', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)
    const popover = await openPopover(user, group, 0)
    await user.click(within(popover).getByRole('button', { name: strings.action.clear }))

    expect(triggerAt(group, 0)).toHaveAttribute('data-decision', 'none')
    expect(useSessionStore.getState().decisions).toEqual([])
    expect(screen.getByText(strings.practice.reviewedProgress(0, TOTAL))).toBeInTheDocument()
  })

  it('menyimpan draf otomatis ke localStorage setelah keputusan dibuat', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)

    await waitFor(() => expect(loadDraft(scenario.id)).not.toBeNull(), { timeout: 3000 })
    expect(loadDraft(scenario.id)?.decisions).toHaveLength(1)
  })
})

describe('PracticePage — undo, redo, dan hapus semua', () => {
  it('mengaktifkan tombol urungkan/ulangi mengikuti riwayat', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)

    const undo = screen.getByRole('button', { name: strings.practice.undo })
    expect(undo).toBeEnabled()
    await user.click(undo)

    expect(useSessionStore.getState().decisions).toEqual([])
    expect(screen.getByRole('button', { name: strings.practice.undo })).toBeDisabled()

    const redo = screen.getByRole('button', { name: strings.practice.redo })
    expect(redo).toBeEnabled()
    await user.click(redo)

    expect(useSessionStore.getState().decisions).toHaveLength(1)
  })

  it('membuka dialog konfirmasi lalu membatalkannya', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)
    await user.click(screen.getByRole('button', { name: strings.practice.reset }))

    const dialog = await screen.findByRole('dialog', { name: strings.practice.resetConfirmTitle })
    expect(screen.getByText(strings.practice.resetConfirmBody)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: strings.common.cancel }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: strings.practice.resetConfirmTitle })).toBeNull(),
    )
    expect(useSessionStore.getState().decisions).toHaveLength(1)
  })

  it('mengosongkan semua keputusan setelah konfirmasi', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)
    await user.click(screen.getByRole('button', { name: strings.practice.reset }))
    const dialog = await screen.findByRole('dialog', { name: strings.practice.resetConfirmTitle })
    await user.click(within(dialog).getByRole('button', { name: strings.common.confirm }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: strings.practice.resetConfirmTitle })).toBeNull(),
    )
    expect(useSessionStore.getState().decisions).toEqual([])
    expect(screen.getByText(strings.practice.reviewedProgress(0, TOTAL))).toBeInTheDocument()
  })

  it('menampilkan tanda semua bagian sudah diperiksa', async () => {
    useSessionStore.setState({
      scenarioId: scenario.id,
      decisions: scenario.segments.map((segment) => ({
        segmentId: segment.id,
        action: 'keep' as const,
      })),
      startedAt: Date.now(),
    })

    await renderReady()

    expect(screen.getByText(strings.practice.reviewedAll)).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.practice.reset })).toBeEnabled()
    expect(screen.getByRole('progressbar', { name: strings.a11y.progress })).toHaveAttribute(
      'aria-valuenow',
      String(TOTAL),
    )
  })
})

describe('PracticePage — mode petunjuk', () => {
  it('menyalakan dan mematikan mode petunjuk', async () => {
    const user = userEvent.setup()
    await renderReady()

    const toggle = screen.getByRole('button', { name: strings.practice.hint })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(useSessionStore.getState().hintUsed).toBe(true)
    expect(screen.getByRole('button', { name: strings.practice.hintOff })).toBeInTheDocument()
    expect(screen.getByText(strings.practice.hintActive)).toBeInTheDocument()
    expect(screen.getByText(strings.practice.hintBadge)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: strings.practice.hintOff }))

    expect(useSessionStore.getState().hintUsed).toBe(false)
    expect(screen.queryByText(strings.practice.hintActive)).toBeNull()
  })

  it('menyembunyikan saklar petunjuk bila pengaturan melarangnya', async () => {
    useSettingsStore.setState({ hintsEnabled: false })

    await renderReady()

    expect(screen.queryByRole('button', { name: strings.practice.hint })).toBeNull()
  })
})

describe('PracticePage — draf tersimpan', () => {
  it('memulihkan draf keputusan dan petunjuk dari localStorage', async () => {
    const target = scenario.segments[1]
    writeDraft([{ segmentId: target.id, action: 'remove' }], true)

    await renderReady()

    expect(screen.getByText(strings.practice.reviewedProgress(1, TOTAL))).toBeInTheDocument()
    expect(useSessionStore.getState().decisions).toHaveLength(1)
    expect(useSessionStore.getState().hintUsed).toBe(true)
    expect(
      screen.getByRole('button', { name: triggerName(1, strings.action.remove) }),
    ).toBeInTheDocument()
  })

  it('memulai dari nol bila draf tidak ada', async () => {
    await renderReady()

    expect(screen.getByText(strings.practice.reviewedProgress(0, TOTAL))).toBeInTheDocument()
    expect(loadDraft(scenario.id)).toBeNull()
  })
})

describe('PracticePage — mengirim jawaban', () => {
  it('menyimpan percobaan, menghapus draf, dan menuju halaman hasil', async () => {
    const user = userEvent.setup()
    const group = await renderReady()

    await pickAction(user, group, 0, /^Hapus/)
    await waitFor(() => expect(loadDraft(scenario.id)).not.toBeNull(), { timeout: 3000 })

    await user.click(screen.getByRole('button', { name: strings.practice.submit }))

    expect(await screen.findByText('HALAMAN HASIL')).toBeInTheDocument()

    const { attempts } = useProgressStore.getState()
    expect(attempts).toHaveLength(1)
    expect(attempts[0].scenarioId).toBe(scenario.id)
    expect(attempts[0].decisions).toHaveLength(1)
    expect(attempts[0].result.perSegment).toHaveLength(TOTAL)
    expect(loadDraft(scenario.id)).toBeNull()
    expect(useSessionStore.getState().result).not.toBeNull()
    expect(draftKey(scenario.id)).toBe(`pdp:draft:${scenario.id}`)
  })

  it('tetap bisa dikirim walaupun belum ada satu pun keputusan', async () => {
    const user = userEvent.setup()
    await renderReady()

    await user.click(screen.getByRole('button', { name: strings.practice.submit }))

    expect(await screen.findByText('HALAMAN HASIL')).toBeInTheDocument()
    expect(useProgressStore.getState().attempts).toHaveLength(1)
  })
})

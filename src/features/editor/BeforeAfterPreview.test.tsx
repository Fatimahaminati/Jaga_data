import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { buildPreview } from '@/domain/preview/buildPreview'
import type { Decision, Verdict } from '@/domain/types'
import { BeforeAfterPreview } from './BeforeAfterPreview'

const scenario = scenarios[0]
const segments = scenario.segments

type User = ReturnType<typeof userEvent.setup>

function beforePanel(): HTMLElement {
  return screen.getByLabelText(strings.preview.beforeAria)
}

function afterPanel(): HTMLElement {
  return screen.getByLabelText(strings.preview.afterAria)
}

async function showAfter(user: User): Promise<HTMLElement> {
  await user.click(screen.getByRole('tab', { name: strings.preview.tabAfter }))
  return afterPanel()
}

async function showBefore(user: User): Promise<HTMLElement> {
  await user.click(screen.getByRole('tab', { name: strings.preview.tabBefore }))
  return beforePanel()
}

describe('BeforeAfterPreview', () => {
  it('menampilkan panel sebelum dan sesudah lewat tab', async () => {
    const user = userEvent.setup()
    const preview = buildPreview(scenario, [])
    render(<BeforeAfterPreview preview={preview} />)

    expect(screen.getByRole('region', { name: strings.preview.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: strings.preview.title })).toBeInTheDocument()

    const tablist = screen.getByRole('tablist', { name: strings.preview.title })
    const beforeTab = within(tablist).getByRole('tab', { name: strings.preview.tabBefore })
    const afterTab = within(tablist).getByRole('tab', { name: strings.preview.tabAfter })
    expect(beforeTab).toHaveAttribute('aria-selected', 'true')
    expect(afterTab).toHaveAttribute('aria-selected', 'false')

    // Tab bawaan menampilkan panel "sebelum"; panel "sesudah" belum dirender.
    const before = beforePanel()
    segments.forEach((segment) => {
      expect(within(before).getByText(segment.text)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(strings.preview.afterAria)).not.toBeInTheDocument()

    await user.click(afterTab)

    const after = afterPanel()
    segments.forEach((segment) => {
      expect(within(after).getByText(segment.text)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(strings.preview.beforeAria)).not.toBeInTheDocument()
    expect(afterTab).toHaveAttribute('aria-selected', 'true')
  })

  it('menandai segmen yang dihapus, digeneralisasi, dan dipertahankan', async () => {
    const user = userEvent.setup()
    const decisions: Decision[] = [
      { segmentId: segments[1].id, action: 'generalize', optionId: segments[1].options[0].id },
      { segmentId: segments[2].id, action: 'remove' },
      { segmentId: segments[6].id, action: 'keep' },
    ]
    const preview = buildPreview(scenario, decisions)
    render(<BeforeAfterPreview preview={preview} />)

    const after = await showAfter(user)
    expect(after.querySelector('.preview-removed')).not.toBeNull()
    expect(after.querySelector('.preview-generalized')).not.toBeNull()
    expect(after.querySelector('.preview-kept')).not.toBeNull()

    // Teks asli yang dihapus tetap dirender tapi ditandai kelas preview-removed,
    // digeneralisasi berganti label, dan dipertahankan tetap ada.
    expect(within(after).getByText(segments[2].text)).toHaveClass('preview-removed')
    expect(within(after).getByText(segments[1].options[0].label)).toHaveClass('preview-generalized')
    expect(within(after).queryByText(segments[1].text)).not.toBeInTheDocument()
    expect(within(after).getByText(segments[6].text)).toBeInTheDocument()

    // Panel "sebelum" selalu memakai teks asli.
    const before = await showBefore(user)
    expect(within(before).getByText(segments[2].text)).toBeInTheDocument()
  })

  it('menandai segmen sesuai verdict benar, sebagian, dan keliru', async () => {
    const user = userEvent.setup()
    const decisions: Decision[] = [
      { segmentId: segments[6].id, action: 'keep' },
      { segmentId: segments[7].id, action: 'remove' },
    ]
    const verdicts: Record<string, Verdict> = {
      [segments[0].id]: 'correct',
      [segments[6].id]: 'partial',
      [segments[7].id]: 'wrong',
    }
    const preview = buildPreview(scenario, decisions)
    render(<BeforeAfterPreview preview={preview} verdicts={verdicts} />)

    const after = await showAfter(user)

    const correct = within(after).getByText(segments[0].text)
    expect(correct).toHaveClass('bg-brand-50/70')

    const partial = within(after).getByText(segments[6].text)
    expect(partial).toHaveClass('bg-amber-50')
    expect(partial).not.toHaveClass('preview-kept')

    const wrong = within(after).getByText(segments[7].text)
    expect(wrong).toHaveClass('bg-accent-50')
  })

  it('menampilkan peringatan bila semua bagian dihapus', async () => {
    const user = userEvent.setup()
    const decisions: Decision[] = segments.map((segment) => ({
      segmentId: segment.id,
      action: 'remove',
    }))
    const preview = buildPreview(scenario, decisions)
    render(<BeforeAfterPreview preview={preview} />)

    const after = await showAfter(user)

    expect(screen.getByRole('status')).toHaveTextContent(strings.preview.emptyAfter)
    segments.forEach((segment) => {
      expect(within(after).getByText(segment.text)).toHaveClass('preview-removed')
    })
  })

  it('berpindah di antara tab Sebelum dan Sesudah dengan papan ketik', async () => {
    const user = userEvent.setup()
    const preview = buildPreview(scenario, [{ segmentId: segments[2].id, action: 'remove' }])
    render(<BeforeAfterPreview preview={preview} />)

    const tablist = screen.getByRole('tablist', { name: strings.preview.title })
    expect(within(tablist).getAllByRole('tab')).toHaveLength(2)

    const beforeTab = within(tablist).getByRole('tab', { name: strings.preview.tabBefore })
    beforeTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByLabelText(strings.preview.afterAria)).toBeInTheDocument()
    expect(
      within(screen.getByLabelText(strings.preview.afterAria)).getByText(segments[2].text),
    ).toHaveClass('preview-removed')
    expect(
      within(screen.getByRole('tablist', { name: strings.preview.title })).getByRole('tab', {
        name: strings.preview.tabAfter,
      }),
    ).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')

    expect(screen.getByLabelText(strings.preview.beforeAria)).toBeInTheDocument()
    expect(screen.queryByLabelText(strings.preview.afterAria)).not.toBeInTheDocument()
  })
})

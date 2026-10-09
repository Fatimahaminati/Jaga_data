import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import type { Decision } from '@/domain/types'
import { SEGMENTS_PER_SECTION, TokenEditor } from './TokenEditor'

const scenario = scenarios[0]
const TOTAL_SECTIONS = Math.ceil(scenario.segments.length / SEGMENTS_PER_SECTION)

function labelFor(index: number, status: string): string {
  return `${strings.practice.segmentAria(scenario.segments[index].text)} — ${status}`
}

function Harness({
  hintActive = false,
  initial = [],
}: {
  hintActive?: boolean
  initial?: Decision[]
}) {
  const [decisions, setDecisions] = useState<Decision[]>(initial)

  return (
    <TokenEditor
      scenario={scenario}
      decisions={decisions}
      hintActive={hintActive}
      onChange={(decision) =>
        setDecisions((prev) => [
          ...prev.filter((item) => item.segmentId !== decision.segmentId),
          decision,
        ])
      }
      onClear={(segmentId) =>
        setDecisions((prev) => prev.filter((item) => item.segmentId !== segmentId))
      }
    />
  )
}

describe('TokenEditor', () => {
  it('menampilkan segmen bagian pertama beserta indikator bagian', () => {
    render(<Harness />)

    const group = screen.getByRole('group', { name: strings.practice.messageTitle })
    expect(group).toBeInTheDocument()
    expect(screen.getByText(strings.practice.sectionOf(1, TOTAL_SECTIONS))).toBeInTheDocument()
    expect(screen.getByText(strings.practice.instruction)).toBeInTheDocument()

    // Hanya segmen bagian pertama yang dirender; sisanya menyusul lewat tombol Lanjut.
    scenario.segments.slice(0, SEGMENTS_PER_SECTION).forEach((_segment, index) => {
      expect(
        screen.getByRole('button', { name: labelFor(index, strings.practice.untouched) }),
      ).toBeInTheDocument()
    })
    scenario.segments.slice(SEGMENTS_PER_SECTION).forEach((_segment, offset) => {
      expect(
        screen.queryByRole('button', {
          name: labelFor(SEGMENTS_PER_SECTION + offset, strings.practice.untouched),
        }),
      ).toBeNull()
    })
    expect(within(group).getAllByRole('button')).toHaveLength(SEGMENTS_PER_SECTION)

    expect(screen.getByRole('button', { name: strings.common.back })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.common.next })).toBeEnabled()
  })

  it('berpindah ke bagian berikutnya dan menutup popover yang terbuka', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: labelFor(0, strings.practice.untouched) }))
    expect(screen.queryAllByRole('dialog', { name: strings.a11y.popover })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: strings.common.next }))

    expect(screen.getByText(strings.practice.sectionOf(2, TOTAL_SECTIONS))).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: labelFor(SEGMENTS_PER_SECTION, strings.practice.untouched),
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: labelFor(0, strings.practice.untouched) }),
    ).toBeNull()
    // Popover segmen tertutup saat berpindah bagian.
    expect(screen.queryAllByRole('dialog', { name: strings.a11y.popover })).toHaveLength(0)
    expect(screen.getByRole('button', { name: strings.common.back })).toBeEnabled()
  })

  it('kembali ke bagian sebelumnya lewat tombol Kembali', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: strings.common.next }))
    await user.click(screen.getByRole('button', { name: strings.common.back }))

    expect(screen.getByText(strings.practice.sectionOf(1, TOTAL_SECTIONS))).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: labelFor(0, strings.practice.untouched) }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.common.back })).toBeDisabled()
  })

  it('menutup popover segmen lain saat pemicu lain diklik', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: labelFor(0, strings.practice.untouched) }))

    expect(screen.getByText(`“${scenario.segments[0].text}”`)).toBeInTheDocument()
    expect(screen.queryAllByRole('dialog', { name: strings.a11y.popover })).toHaveLength(1)

    // Segmen lain diklik: popover yang terbuka tertutup dan hanya satu popover boleh terbuka.
    await user.click(screen.getByRole('button', { name: labelFor(1, strings.practice.untouched) }))

    expect(screen.queryByText(`“${scenario.segments[0].text}”`)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('dialog', { name: strings.a11y.popover })).toHaveLength(0)

    // Klik kedua pada segmen yang sama membuka popover-nya.
    await user.click(screen.getByRole('button', { name: labelFor(1, strings.practice.untouched) }))

    expect(screen.getByText(`“${scenario.segments[1].text}”`)).toBeInTheDocument()
    expect(screen.queryAllByRole('dialog', { name: strings.a11y.popover })).toHaveLength(1)
  })

  it('menyimpan keputusan dan memperbarui status pada pemicu', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: labelFor(1, strings.practice.untouched) }))
    await user.click(screen.getByRole('button', { name: new RegExp(`^${strings.action.keep}`) }))

    expect(screen.getByRole('button', { name: labelFor(1, strings.action.keep) })).toHaveAttribute(
      'data-decision',
      'keep',
    )
    // Pemicu segmen lain tetap belum dipilih.
    expect(
      screen.getByRole('button', { name: labelFor(0, strings.practice.untouched) }),
    ).toHaveAttribute('data-decision', 'none')
  })

  it('keputusan umum yang dipilih tampil di popover segmen terkait', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[{ segmentId: scenario.segments[3].id, action: 'remove' }]} />)

    // Segmen keempat ada di bagian kedua.
    await user.click(screen.getByRole('button', { name: strings.common.next }))
    expect(
      screen.getByRole('button', { name: labelFor(3, strings.action.remove) }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: labelFor(3, strings.action.remove) }))

    expect(
      screen.getByRole('button', { name: new RegExp(`^${strings.action.remove}`) }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('membatalkan keputusan lewat tombol batal pilihan', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[{ segmentId: scenario.segments[0].id, action: 'keep' }]} />)

    await user.click(screen.getByRole('button', { name: labelFor(0, strings.action.keep) }))
    await user.click(screen.getByRole('button', { name: strings.action.clear }))

    expect(
      screen.getByRole('button', { name: labelFor(0, strings.practice.untouched) }),
    ).toBeInTheDocument()
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('menandai hint pada segmen bagian aktif saat mode petunjuk aktif', () => {
    render(<Harness hintActive />)

    scenario.segments.slice(0, SEGMENTS_PER_SECTION).forEach((_segment, index) => {
      expect(
        screen.getByRole('button', { name: labelFor(index, strings.practice.untouched) }),
      ).toHaveAttribute('data-hint', 'true')
    })
  })
})

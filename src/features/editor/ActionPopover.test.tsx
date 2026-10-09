import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import type { Decision } from '@/domain/types'
import { ActionPopover, type ActionPopoverProps } from './ActionPopover'

const segment = scenarios[0].segments[1]
const triggerName = `${strings.practice.segmentAria(segment.text)} — ${strings.practice.untouched}`
const keepPattern = new RegExp(`^${strings.action.keep}`)
const removePattern = new RegExp(`^${strings.action.remove}`)
const generalizePattern = new RegExp(`^${strings.action.generalize}`)

interface HarnessProps {
  decision?: Decision
  contextBefore?: string
  contextAfter?: string
  onChange?: ActionPopoverProps['onChange']
  onClear?: ActionPopoverProps['onClear']
  onOpenChange?: ActionPopoverProps['onOpenChange']
}

function Harness({
  decision,
  contextBefore,
  contextAfter,
  onChange,
  onClear,
  onOpenChange,
}: HarnessProps) {
  const [open, setOpen] = useState(false)
  return (
    <ActionPopover
      segment={segment}
      contextBefore={contextBefore}
      contextAfter={contextAfter}
      decision={decision}
      hintActive={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        onOpenChange?.(next)
      }}
      onChange={onChange ?? (() => {})}
      onClear={onClear ?? (() => {})}
    />
  )
}

/** Ambil tombol opsi samarkan sesuai urutan array (tangga keumuman). */
function optionButtons(): HTMLElement[] {
  const wrapper = screen.getByText(strings.action.chooseReplacement).closest('div')
  expect(wrapper).not.toBeNull()
  return within(wrapper as HTMLElement)
    .getAllByRole('listitem')
    .map((item) => within(item).getByRole('button'))
}

describe('ActionPopover', () => {
  it('menampilkan pemicu segmen tanpa keputusan', () => {
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: triggerName })
    expect(trigger).toHaveAttribute('data-decision', 'none')
    expect(trigger).toHaveAttribute('data-hint', 'false')
    expect(trigger).toHaveAttribute('data-selected', 'false')
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('membuka popover saat pemicu diklik dan memfokuskan isinya', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: triggerName }))

    const content = screen.getByText(strings.action.title).closest('div') as HTMLElement | null
    expect(content).not.toBeNull()
    expect(content).toContainElement(document.activeElement as HTMLElement)
    expect(screen.getByRole('button', { name: keepPattern })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: removePattern })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: generalizePattern })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.common.close })).toBeInTheDocument()
  })

  it('membuka popover dengan papan ketik', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('button', { name: triggerName }).focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText(strings.action.title)).toBeInTheDocument()
  })

  it('berpindah antar tombol aksi dengan Tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: triggerName }))

    // Fokus langsung masuk ke tombol aksi pertama di dalam popover.
    expect(screen.getByRole('button', { name: keepPattern })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: removePattern })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: generalizePattern })).toHaveFocus()
  })

  it('memilih Pertahankan memanggil onChange lalu menutup popover', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: keepPattern }))

    expect(onChange).toHaveBeenCalledWith({ segmentId: segment.id, action: 'keep' })
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('memilih Hapus memanggil onChange dengan aksi remove', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: removePattern }))

    expect(onChange).toHaveBeenCalledWith({ segmentId: segment.id, action: 'remove' })
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('membuka daftar opsi Samarkan tanpa langsung mengonfirmasi', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: generalizePattern }))

    expect(screen.getByText(strings.action.chooseReplacement)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()

    // Penanda kualitas sengaja disembunyikan sampai siswa memilih.
    expect(screen.queryByText(strings.action.quality.poor)).not.toBeInTheDocument()
    expect(screen.queryByText(strings.action.quality.acceptable)).not.toBeInTheDocument()
    expect(screen.queryByText(strings.action.quality.good)).not.toBeInTheDocument()

    // Tombol konfirmasi menunggu pilihan.
    expect(screen.getByRole('button', { name: strings.action.useOption })).toBeDisabled()
  })

  it('menampilkan pratinjau kalimat saat opsi disorot, sebelum dikonfirmasi', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} contextBefore="Namaku" contextAfter="dan aku kelas 7." />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: generalizePattern }))

    // Sebelum disorot: kotak pratinjau sudah ada (tingginya tetap) berisi teks dasar.
    expect(screen.getByRole('status')).toHaveTextContent(strings.action.previewHint)

    const option = optionButtons()[0]
    await user.hover(option)

    const preview = screen.getByRole('status')
    expect(preview).toHaveTextContent(strings.action.sentencePreview)
    expect(preview).toHaveTextContent('Namaku')
    expect(preview).toHaveTextContent(segment.options[0].label)
    expect(preview).toHaveTextContent('dan aku kelas 7.')
    expect(onChange).not.toHaveBeenCalled()

    // Menyorot belum dianggap memilih: penanda kualitas tetap tersembunyi.
    expect(screen.queryByText(strings.action.quality[segment.options[0].quality])).toBeNull()

    await user.unhover(option)
    // Kotaknya tetap ada agar ukuran popover tidak berubah — hanya kembali ke teks dasar.
    const rested = screen.getByRole('status')
    expect(rested).toHaveTextContent(strings.action.previewHint)
    expect(rested).not.toHaveTextContent(segment.options[0].label)
  })

  it('memilih opsi lalu mengonfirmasi memanggil onChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: generalizePattern }))

    const option = optionButtons()[0]
    await user.click(option)

    // Setelah dipilih: penanda kualitas (ikon + teks) tampil, tetapi belum terkonfirmasi.
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(option).getByText(strings.action.quality[segment.options[0].quality]),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(segment.options[0].label)
    expect(onChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: strings.action.useOption }))

    expect(onChange).toHaveBeenCalledWith({
      segmentId: segment.id,
      action: 'generalize',
      optionId: segment.options[0].id,
    })
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('menampilkan opsi sesuai urutan array (tangga keumuman)', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    await user.click(screen.getByRole('button', { name: generalizePattern }))

    const labels = segment.options.map((option) => option.label)
    expect(optionButtons()).toHaveLength(labels.length)
    optionButtons().forEach((button, index) => {
      expect(button).toHaveTextContent(labels[index])
    })
  })

  it('opsi pengganti langsung tampil bila keputusannya generalisasi', async () => {
    const stored = segment.options[1]
    const user = userEvent.setup()
    render(
      <Harness decision={{ segmentId: segment.id, action: 'generalize', optionId: stored.id }} />,
    )

    await user.click(
      screen.getByRole('button', {
        name: `${strings.practice.segmentAria(segment.text)} — ${strings.action.generalize}`,
      }),
    )

    expect(screen.getByText(strings.action.chooseReplacement)).toBeInTheDocument()

    const selected = optionButtons()[1]
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    // Keputusan tersimpan = sudah pernah dipilih, jadi penanda kualitas ikut tampil.
    expect(within(selected).getByText(strings.action.quality[stored.quality])).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(stored.label)

    const untouched = optionButtons()[0]
    expect(untouched).toHaveAttribute('aria-pressed', 'false')
    expect(within(untouched).queryByText(/Masih terlalu jelas|Cukup aman|Aman/)).toBeNull()

    expect(screen.getByRole('button', { name: generalizePattern })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('menampilkan status keputusan pada pemicu', () => {
    render(<Harness decision={{ segmentId: segment.id, action: 'keep' }} />)

    const trigger = screen.getByRole('button', {
      name: `${strings.practice.segmentAria(segment.text)} — ${strings.action.keep}`,
    })
    expect(trigger).toHaveAttribute('data-decision', 'keep')
  })

  it('tombol batal pilihan tidak muncul bila belum ada keputusan', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    expect(screen.queryByRole('button', { name: strings.action.clear })).not.toBeInTheDocument()
  })

  it('tombol batal pilihan memanggil onClear lalu menutup popover', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<Harness decision={{ segmentId: segment.id, action: 'remove' }} onClear={onClear} />)

    await user.click(
      screen.getByRole('button', {
        name: `${strings.practice.segmentAria(segment.text)} — ${strings.action.remove}`,
      }),
    )
    await user.click(screen.getByRole('button', { name: strings.action.clear }))

    expect(onClear).toHaveBeenCalledWith(segment.id)
    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
  })

  it('menutup popover dengan tombol Tutup dan mengembalikan fokus', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: triggerName })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: strings.common.close }))

    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('menutup popover dengan Escape', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: triggerName }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await user.keyboard('{Escape}')

    expect(screen.queryByText(strings.action.title)).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button', { name: triggerName })).toHaveAttribute(
      'data-selected',
      'false',
    )
  })

  it('mengutip teks segmen di dalam popover', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: triggerName }))

    const title = screen.getByText(strings.action.title)
    const content = title.closest('div')
    expect(content).not.toBeNull()
    expect(within(content as HTMLElement).getByText(`“${segment.text}”`)).toBeInTheDocument()
  })
})

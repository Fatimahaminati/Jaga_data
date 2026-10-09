import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { ExportMenu, type ExportItem } from './ExportMenu'

function successMessage(label: string): string {
  return strings.export.success(label.replace(/[()]/g, '').trim())
}

function buildItems(runs: Record<string, () => void>): ExportItem[] {
  return [
    { id: 'json', label: strings.export.json, run: runs.json },
    { id: 'csv', label: strings.export.csv, run: runs.csv },
    { id: 'pdf', label: strings.export.pdf, run: runs.pdf },
    { id: 'png', label: strings.export.png, run: runs.png },
  ]
}

describe('ExportMenu', () => {
  it('menampilkan keempat format ekspor', () => {
    const run = vi.fn()
    render(<ExportMenu items={buildItems({ json: run, csv: run, pdf: run, png: run })} />)

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: strings.export.json })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.export.csv })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.export.pdf })).toBeEnabled()
    expect(screen.getByRole('button', { name: strings.export.png })).toBeEnabled()
  })

  it('memanggil handler ekspor yang sesuai dan menampilkan pesan sukses', async () => {
    const json = vi.fn()
    const csv = vi.fn()
    const pdf = vi.fn()
    const png = vi.fn()
    const user = userEvent.setup()
    render(<ExportMenu items={buildItems({ json, csv, pdf, png })} label={strings.export.label} />)

    await user.click(screen.getByRole('button', { name: strings.export.json }))

    expect(json).toHaveBeenCalledTimes(1)
    expect(csv).not.toHaveBeenCalled()
    expect(pdf).not.toHaveBeenCalled()
    expect(png).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(successMessage(strings.export.json)),
    )
  })

  it('menonaktifkan semua tombol selama ekspor berjalan', async () => {
    let finish: (() => void) | undefined
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    const json = vi.fn(() => pending)
    const csv = vi.fn()
    const user = userEvent.setup()
    render(<ExportMenu items={buildItems({ json, csv, pdf: vi.fn(), png: vi.fn() })} />)

    const jsonButton = screen.getByRole('button', { name: strings.export.json })
    const csvButton = screen.getByRole('button', { name: strings.export.csv })

    await user.click(jsonButton)

    expect(screen.getByRole('status')).toHaveTextContent(strings.export.preparing)
    expect(jsonButton).toBeDisabled()
    expect(csvButton).toBeDisabled()

    await user.click(csvButton)
    expect(csv).not.toHaveBeenCalled()

    finish?.()
    await waitFor(() => expect(jsonButton).toBeEnabled())
    expect(csvButton).toBeEnabled()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(successMessage(strings.export.json)),
    )
  })

  it('menampilkan pesan gagal bila proses ekspor melempar error', async () => {
    const json = vi.fn(() => {
      throw new Error('gagal')
    })
    const user = userEvent.setup()
    render(<ExportMenu items={[{ id: 'json', label: strings.export.json, run: json }]} />)

    await user.click(screen.getByRole('button', { name: strings.export.json }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(strings.export.failed))
    expect(screen.getByRole('button', { name: strings.export.json })).toBeEnabled()
  })

  it('memakai ikon bawaan sesuai id dan label menu opsional', async () => {
    const json = vi.fn()
    const user = userEvent.setup()
    render(
      <ExportMenu items={[{ id: 'json', label: strings.export.json, run: json }]} align="end" />,
    )

    expect(screen.getByRole('list')).toHaveClass('justify-end')
    await user.click(screen.getByRole('button', { name: strings.export.json }))
    await waitFor(() => expect(json).toHaveBeenCalledTimes(1))
  })

  it('menampilkan keterangan nonaktif bila tidak ada data untuk diekspor', () => {
    render(<ExportMenu items={[]} label={strings.export.label} />)

    expect(screen.getByText(strings.export.disabledHistory)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

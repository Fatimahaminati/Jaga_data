import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { HintToggle } from './HintToggle'

describe('HintToggle', () => {
  it('menampilkan tombol aktifkan petunjuk saat nonaktif', () => {
    render(<HintToggle active={false} onToggle={() => {}} />)

    const button = screen.getByRole('button', { name: strings.practice.hint })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveClass('btn', 'btn-secondary')
    // Target sentuh minimal 44px: ukuran sm (40px) tidak dipakai.
    expect(button).not.toHaveClass('btn-sm')
    expect(screen.queryByText(strings.practice.hintBadge)).not.toBeInTheDocument()
  })

  it('menampilkan tombol sembunyikan petunjuk beserta lencana saat aktif', () => {
    render(<HintToggle active onToggle={() => {}} />)

    const button = screen.getByRole('button', { name: strings.practice.hintOff })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveClass('btn', 'btn-primary')
    expect(button).not.toHaveClass('btn-sm')
    expect(screen.getByText(strings.practice.hintBadge)).toBeInTheDocument()
  })

  it('memanggil onToggle saat ditekan', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<HintToggle active={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('button', { name: strings.practice.hint }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

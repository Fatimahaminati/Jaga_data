import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { Button } from './Button'

describe('Button', () => {
  it('merender tombol dengan type bawaan button', () => {
    render(<Button>{strings.common.retry}</Button>)

    const button = screen.getByRole('button', { name: strings.common.retry })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('btn', 'btn-primary')
    expect(button).toBeEnabled()
  })

  it('memakai kelas varian yang sesuai untuk setiap varian', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const

    variants.forEach((variant) => {
      const { unmount } = render(
        <Button variant={variant}>{`${strings.common.close}-${variant}`}</Button>,
      )
      expect(screen.getByRole('button')).toHaveClass(`btn-${variant}`)
      unmount()
    })
  })

  it('menambahkan kelas ukuran hanya untuk sm dan lg', () => {
    const { unmount } = render(<Button size="sm">{strings.common.next}</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-sm')
    expect(screen.getByRole('button')).not.toHaveClass('btn-lg')
    unmount()

    render(<Button size="lg">{strings.common.back}</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-lg')
    expect(screen.getByRole('button')).not.toHaveClass('btn-sm')
  })

  it('mewariskan status disabled sehingga tidak bisa diklik', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button disabled onClick={onClick}>
        {strings.common.cancel}
      </Button>,
    )

    const button = screen.getByRole('button', { name: strings.common.cancel })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('menjalankan handler klik saat aktif', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>{strings.common.done}</Button>)

    await user.click(screen.getByRole('button', { name: strings.common.done }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('merender ikon di dalam tombol dan meneruskan atribut lain', () => {
    render(
      <Button aria-label={strings.a11y.closeDialog} data-khusus="ya">
        <span data-testid="ikon" />
        {strings.common.close}
      </Button>,
    )

    expect(screen.getByTestId('ikon')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: strings.a11y.closeDialog })
    expect(button).toHaveAttribute('data-khusus', 'ya')
    expect(button).toHaveTextContent(strings.common.close)
  })

  it('mendukung type submit bila dispesifikkan', () => {
    render(<Button type="submit">{strings.common.confirm}</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})

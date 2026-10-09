import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('ledakan-uji')
}

function Quiet(): JSX.Element {
  return <p>{strings.home.privacyTitle}</p>
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('melewatkan anak komponen bila tidak ada error', () => {
    render(
      <ErrorBoundary>
        <Quiet />
      </ErrorBoundary>,
    )

    expect(screen.getByText(strings.home.privacyTitle)).toBeInTheDocument()
    expect(screen.queryByText(strings.errors.general)).not.toBeInTheDocument()
  })

  it('menampilkan fallback berisi pesan error saat anak melempar', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: strings.errors.general })).toBeInTheDocument()
    expect(screen.getByText('ledakan-uji')).toBeInTheDocument()
    expect(screen.queryByText(strings.home.privacyTitle)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.common.reset })).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
  })

  it('tombol mulai ulang mengarahkan ke beranda (hash diatur ulang)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    window.location.hash = '#/latihan/perkenalan-diri'

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    // `window.location.reload` tidak bisa di-stub di jsdom (properti unforgeable),
    // sehingga yang diperiksa hanyalah pengaturan hash menuju beranda.
    await user.click(screen.getByRole('button', { name: strings.common.reset }))

    expect(window.location.hash).toBe('#/')
  })
})

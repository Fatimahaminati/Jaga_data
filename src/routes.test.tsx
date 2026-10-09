import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { strings } from '@/content/strings/id'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AppRoutes } from './routes'

/** Impor modul rute malas bisa lebih lama saat mesin sedang ramai. */
const WAIT = { timeout: 5000 }

function renderRoutes() {
  return render(
    <HashRouter>
      <AppRoutes />
    </HashRouter>,
  )
}

beforeEach(() => {
  window.location.hash = '#/'
  window.scrollTo = vi.fn()
  window.localStorage.clear()
  useProgressStore.setState({ attempts: [] })
  useSettingsStore.setState({
    nickname: '',
    fontScale: 'normal',
    highContrast: false,
    hintsEnabled: true,
  })
})

describe('AppRoutes — rute dikenal', () => {
  it('menampilkan beranda pada rute /', async () => {
    renderRoutes()

    // Beranda diimpor eagerly (bukan lazy) agar tidak ada pergantian layout
    // setelah paint pertama → CLS nol untuk halaman pendaratan.
    expect(
      screen.getByRole('heading', { level: 1, name: strings.home.heroTitle }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('menggulung ke atas setiap kali rute berubah', async () => {
    const user = userEvent.setup()
    renderRoutes()
    await screen.findByRole('heading', { level: 1, name: strings.home.heroTitle }, WAIT)

    await user.click(screen.getByRole('link', { name: strings.nav.history }))

    expect(
      await screen.findByRole('heading', { level: 1, name: strings.history.title }, WAIT),
    ).toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('merender kerangka aplikasi: header, konten utama, dan footer', async () => {
    renderRoutes()
    await screen.findByRole('heading', { level: 1, name: strings.home.heroTitle }, WAIT)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: strings.nav.skipToContent })).toBeInTheDocument()
    expect(screen.getByText(strings.nav.footerNote)).toBeInTheDocument()
  })
})

describe('AppRoutes — rute tidak dikenal', () => {
  it('menampilkan halaman 404 untuk alamat yang tidak tersedia', async () => {
    window.location.hash = '#/alamat-tidak-ada'

    renderRoutes()

    expect(
      await screen.findByRole('heading', { level: 1, name: strings.errors.notFoundTitle }, WAIT),
    ).toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText(strings.errors.notFoundBody)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: strings.errors.backHome })).toHaveAttribute(
      'href',
      '#/',
    )
  })

  it('menampilkan 404 untuk rute mirip rute asli', async () => {
    window.location.hash = '#/riwayat/salah'

    renderRoutes()

    expect(
      await screen.findByRole('heading', { name: strings.errors.notFoundTitle }, WAIT),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: strings.history.title })).toBeNull()
  })
})

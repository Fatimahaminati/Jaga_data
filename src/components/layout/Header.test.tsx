import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { useSettingsStore } from '@/stores/settingsStore'
import { Header } from './Header'

function renderHeader(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      nickname: '',
      fontScale: 'normal',
      highContrast: false,
      hintsEnabled: true,
    })
  })

  it('merender tautan navigasi dengan label dari kamus teks', () => {
    renderHeader()

    const nav = screen.getByRole('navigation', { name: strings.nav.mainLabel })
    const links = within(nav).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      strings.nav.home,
      strings.nav.scenarios,
      strings.nav.history,
      strings.nav.guide,
    ])
    expect(screen.getByRole('link', { name: strings.app.name })).toHaveAttribute('href', '/')
  })

  it('menandai tautan aktif sesuai rute saat ini', () => {
    renderHeader('/riwayat')

    const active = screen.getByRole('link', { name: strings.nav.history })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(active).toHaveClass('bg-brand-100', 'text-brand-800')

    const inactive = screen.getByRole('link', { name: strings.nav.guide })
    expect(inactive).not.toHaveAttribute('aria-current')
    expect(inactive).toHaveClass('text-ink-600')
  })

  it('tautan beranda aktif hanya di rute root', () => {
    renderHeader('/')

    const home = screen.getByRole('link', { name: strings.nav.home })
    expect(home).toHaveAttribute('aria-current', 'page')
  })

  it('tombol Pengaturan punya aria-label dan membuka dialog berisi formulir', async () => {
    const user = userEvent.setup()
    renderHeader()

    const trigger = screen.getByRole('button', { name: strings.settings.open })
    expect(trigger).toHaveAttribute('aria-label', strings.settings.open)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(screen.getByRole('dialog')).toHaveAccessibleName(strings.settings.title)
    expect(screen.getByLabelText(new RegExp(strings.guide.nicknameLabel))).toBeInTheDocument()
  })

  it('dialog Pengaturan bisa ditutup dengan tombol tutup', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: strings.settings.open }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: strings.a11y.closeDialog }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

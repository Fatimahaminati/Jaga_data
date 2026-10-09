import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('menyediakan skip-link yang menunjuk ke konten utama', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>{strings.home.heroTitle}</p>
        </AppShell>
      </MemoryRouter>,
    )

    const skipLink = screen.getByRole('link', { name: strings.nav.skipToContent })
    expect(skipLink).toHaveAttribute('href', '#konten-utama')
    expect(skipLink).toHaveClass('skip-link')
  })

  it('merender anak komponen di dalam elemen main ber-id konten-utama', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>{strings.home.heroTitle}</p>
        </AppShell>
      </MemoryRouter>,
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'konten-utama')
    expect(main).toHaveAttribute('tabindex', '-1')
    expect(main).toHaveTextContent(strings.home.heroTitle)
  })

  it('membungkus halaman dengan header dan footer', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>{strings.home.heroTitle}</p>
        </AppShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: strings.nav.mainLabel })).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { strings } from '@/content/strings/id'
import { Footer } from './Footer'

describe('Footer', () => {
  it('menampilkan nama aplikasi dan tagline', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(strings.app.name)
    expect(footer).toHaveTextContent(strings.app.tagline)
  })

  it('menampilkan catatan statis dan pemberitahuan data fiktif', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(strings.nav.footerNote)
    expect(footer).toHaveTextContent(strings.app.fictionalNotice)
  })
})

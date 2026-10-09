import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { strings } from '@/content/strings/id'
import NotFoundPage from './NotFoundPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/alamat-tidak-ada']}>
      <NotFoundPage />
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('menampilkan kode 404 dan penjelasan', () => {
    renderPage()

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: strings.errors.notFoundTitle, level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.errors.notFoundBody)).toBeInTheDocument()
  })

  it('menyediakan tautan kembali ke beranda', () => {
    renderPage()

    const link = screen.getByRole('link', { name: strings.errors.backHome })
    expect(link).toHaveAttribute('href', '/')
  })
})

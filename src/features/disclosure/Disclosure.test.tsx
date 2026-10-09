import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { Disclosure } from './Disclosure'

const TITLE = 'Judul bagian'

function renderDisclosure(defaultOpen = false) {
  return render(
    <Disclosure title={TITLE} defaultOpen={defaultOpen}>
      <ul>
        <li>Konten tersembunyi</li>
      </ul>
    </Disclosure>,
  )
}

function panelOf(button: HTMLElement): HTMLElement | null {
  const panelId = button.getAttribute('aria-controls')
  return panelId ? document.getElementById(panelId) : null
}

describe('Disclosure', () => {
  it('menyembunyikan isi sampai tombol Lihat penjelasan diklik', async () => {
    const user = userEvent.setup()
    renderDisclosure()

    const heading = screen.getByRole('heading', { level: 2, name: TITLE })
    const section = heading.closest('section') as HTMLElement
    const button = within(section).getByRole('button', { name: strings.common.showMore })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(panelOf(button)).toHaveAttribute('hidden')
    expect(within(section).queryByRole('listitem')).toBeNull()

    await user.click(button)

    expect(within(section).getByRole('button', { name: strings.common.showLess })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(panelOf(button)).not.toHaveAttribute('hidden')
    expect(within(section).getByRole('listitem')).toHaveTextContent('Konten tersembunyi')
  })

  it('bisa dibuka dan ditutup dengan keyboard', async () => {
    const user = userEvent.setup()
    renderDisclosure()

    const button = screen.getByRole('button', { name: strings.common.showMore })
    button.focus()

    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('menampilkan isi sejak awal bila defaultOpen diaktifkan', () => {
    renderDisclosure(true)

    const button = screen.getByRole('button', { name: strings.common.showLess })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(panelOf(button)).not.toHaveAttribute('hidden')
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })
})

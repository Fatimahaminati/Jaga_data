import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { Dialog } from './Dialog'

function renderDialog(withDescription = true) {
  return render(
    <Dialog.Root>
      <Dialog.Trigger>{strings.settings.open}</Dialog.Trigger>
      <Dialog.Content
        title={strings.settings.title}
        description={withDescription ? strings.guide.privacyBody : undefined}
      >
        <p>{strings.guide.nicknameLabel}</p>
      </Dialog.Content>
    </Dialog.Root>,
  )
}

describe('Dialog', () => {
  it('tersembunyi sampai pemicu diklik', () => {
    renderDialog()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.settings.open })).toBeInTheDocument()
  })

  it('membuka dialog dengan aria yang benar', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByRole('button', { name: strings.settings.open })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const dialog = screen.getByRole('dialog')
    expect(screen.getByRole('heading', { name: strings.settings.title })).toBeInTheDocument()
    expect(dialog).toHaveAccessibleName(strings.settings.title)
    expect(dialog).toHaveAccessibleDescription(strings.guide.privacyBody)
    expect(screen.getByText(strings.guide.nicknameLabel)).toBeInTheDocument()
  })

  it('memakai judul sebagai deskripsi bila deskripsi tidak diisi', async () => {
    const user = userEvent.setup()
    renderDialog(false)

    await user.click(screen.getByRole('button', { name: strings.settings.open }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleDescription(strings.settings.title)
  })

  it('menutup lewat tombol tutup dan mengembalikan fokus ke pemicu', async () => {
    const user = userEvent.setup()
    renderDialog()

    const trigger = screen.getByRole('button', { name: strings.settings.open })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: strings.a11y.closeDialog })
    await user.click(closeButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('menutup dengan tombol Escape', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: strings.settings.open }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.settings.open })).toHaveFocus()
  })
})

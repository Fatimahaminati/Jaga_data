import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import { Tabs, type TabItem } from './Tabs'

function buildItems(): TabItem[] {
  return [
    {
      value: 'before',
      label: strings.preview.before,
      content: <p>{strings.preview.beforeAria}</p>,
    },
    { value: 'after', label: strings.preview.after, content: <p>{strings.preview.afterAria}</p> },
    {
      value: 'extra',
      label: strings.result.title,
      content: <p>{strings.result.summaryTitle}</p>,
    },
  ]
}

describe('Tabs', () => {
  it('memberi label pada daftar tab dan menampilkan tab pertama', () => {
    render(<Tabs items={buildItems()} label={strings.preview.title} />)

    const list = screen.getByRole('tablist', { name: strings.preview.title })
    const tabs = within(list).getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: strings.preview.before })).toBeInTheDocument()
    expect(screen.getByText(strings.preview.beforeAria)).toBeInTheDocument()
    expect(screen.queryByText(strings.preview.afterAria)).not.toBeInTheDocument()
  })

  it('berganti tab saat diklik', async () => {
    const user = userEvent.setup()
    render(<Tabs items={buildItems()} label={strings.preview.title} />)

    await user.click(screen.getByRole('tab', { name: strings.preview.after }))

    expect(screen.getByRole('tab', { name: strings.preview.after })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: strings.preview.before })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByText(strings.preview.afterAria)).toBeInTheDocument()
    expect(screen.queryByText(strings.preview.beforeAria)).not.toBeInTheDocument()
  })

  it('berganti tab dengan panah kanan dan kiri', async () => {
    const user = userEvent.setup()
    render(<Tabs items={buildItems()} label={strings.preview.title} />)

    const firstTab = screen.getByRole('tab', { name: strings.preview.before })
    firstTab.focus()
    expect(firstTab).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: strings.preview.after })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: strings.preview.after })).toHaveFocus()
    expect(screen.getByText(strings.preview.afterAria)).toBeInTheDocument()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: strings.preview.before })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText(strings.preview.beforeAria)).toBeInTheDocument()
  })

  it('mengaktifkan tab dengan Home dan End', async () => {
    const user = userEvent.setup()
    render(<Tabs items={buildItems()} label={strings.preview.title} />)

    screen.getByRole('tab', { name: strings.preview.before }).focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: strings.result.title })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: strings.preview.before })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('menggabungkan kelas tambahan pada akar', () => {
    const { container } = render(
      <Tabs items={buildItems()} label={strings.preview.title} className="lebar-khusus" />,
    )
    expect(container.firstElementChild).toHaveClass('w-full', 'lebar-khusus')
  })
})

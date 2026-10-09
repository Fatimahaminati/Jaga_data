import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { tips } from '@/content/tips'
import { useSettingsStore } from '@/stores/settingsStore'
import GuidePage from './GuidePage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/panduan']}>
      <GuidePage />
    </MemoryRouter>,
  )
}

function sectionFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 2, name: title })
  const section = heading.closest('section')
  if (!section) throw new Error(`section untuk "${title}" tidak ditemukan`)
  return section
}

async function expand(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
): Promise<HTMLElement> {
  const section = sectionFor(title)
  const button = within(section).getByRole('button', { name: strings.common.showMore })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  await user.click(button)
  expect(within(section).getByRole('button', { name: strings.common.showLess })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  return section
}

beforeEach(() => {
  window.localStorage.clear()
  useSettingsStore.setState({
    nickname: '',
    fontScale: 'normal',
    highContrast: false,
    hintsEnabled: true,
  })
})

describe('GuidePage — konten panduan', () => {
  it('menampilkan judul dan subjudul', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: strings.guide.title })).toBeInTheDocument()
    expect(screen.getByText(strings.guide.subtitle)).toBeInTheDocument()
  })

  it('merapikan panduan ke tiga bagian accordion yang tertutup', async () => {
    renderPage()

    expect(screen.getAllByRole('button', { name: strings.common.showMore })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: strings.common.showLess })).toBeNull()
  })

  it('menampilkan langkah cara memakai setelah accordion dibuka', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.getByRole('heading', { level: 2, name: strings.guide.howToTitle }),
    ).toBeInTheDocument()

    const section = await expand(user, strings.guide.howToTitle)
    expect(within(section).getAllByRole('listitem')).toHaveLength(strings.guide.howToSteps.length)
    for (const step of strings.guide.howToSteps) {
      expect(within(section).getByText(step)).toBeInTheDocument()
    }
  })

  it('menampilkan konsep penting setelah accordion dibuka', async () => {
    const user = userEvent.setup()
    renderPage()

    const section = await expand(user, strings.guide.conceptsTitle)

    expect(within(section).getAllByRole('listitem')).toHaveLength(strings.guide.concepts.length)
    for (const concept of strings.guide.concepts) {
      expect(within(section).getByText(concept.title)).toBeInTheDocument()
      expect(within(section).getByText(concept.body)).toBeInTheDocument()
    }
  })

  it('menampilkan tips perlindungan data setelah accordion dibuka', async () => {
    const user = userEvent.setup()
    renderPage()

    const section = await expand(user, strings.guide.tipsTitle)

    expect(within(section).getAllByRole('listitem')).toHaveLength(tips.length)
    for (const tip of tips) {
      expect(within(section).getByText(tip.body)).toBeInTheDocument()
    }
    expect(within(section).getAllByText(/Tanyakan/).length).toBeGreaterThan(0)
  })

  it('tidak menampilkan istilah teknis apa pun di layar panduan', async () => {
    const user = userEvent.setup()
    renderPage()

    await expand(user, strings.guide.howToTitle)
    await expand(user, strings.guide.conceptsTitle)
    await expand(user, strings.guide.tipsTitle)

    expect(screen.queryByText(/re-identification/i)).toBeNull()
    expect(screen.queryByText(/\(.*\)/)).toBeNull()
  })

  it('menampilkan informasi untuk guru dan janji privasi', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 2, name: strings.guide.teacherTitle }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.guide.teacherBody)).toBeInTheDocument()
    expect(screen.getByText(strings.app.privacyNotice)).toBeInTheDocument()
  })
})

describe('GuidePage — pengaturan tampilan', () => {
  it('menampilkan dan menyembunyikan formulir pengaturan', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByLabelText(strings.guide.nicknameLabel)).toBeNull()

    const openButton = screen.getByRole('button', { name: strings.settings.open })
    expect(openButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(openButton)

    expect(screen.getByLabelText(/Nama panggilan/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.common.close })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.click(screen.getByRole('button', { name: strings.common.close }))

    expect(screen.queryByLabelText(/Nama panggilan/)).toBeNull()
  })

  it('menerapkan pilihan ukuran teks dan kontras tinggi ke store', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: strings.settings.open }))

    await user.click(screen.getByRole('radio', { name: strings.guide.fontScale.xlarge }))
    expect(useSettingsStore.getState().fontScale).toBe('xlarge')

    const contrast = screen.getByRole('checkbox', {
      name: strings.guide.highContrastLabel,
    })
    await user.click(contrast)
    expect(useSettingsStore.getState().highContrast).toBe(true)

    await user.click(screen.getByRole('checkbox', { name: strings.guide.hintsLabel }))
    expect(useSettingsStore.getState().hintsEnabled).toBe(false)
  })

  it('menyimpan nama panggilan dari formulir pengaturan', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: strings.settings.open }))

    await user.type(screen.getByLabelText(/Nama panggilan/), 'Rina')

    expect(useSettingsStore.getState().nickname).toBe('Rina')
  })

  it('meminta konfirmasi sebelum menghapus data lokal', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: strings.settings.open }))

    const clearButton = screen.getByRole('button', { name: strings.guide.clearLocalData })
    await user.click(clearButton)

    expect(
      screen.getByRole('button', { name: strings.guide.clearLocalDataTitle }),
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(strings.guide.clearLocalDataBody))).toBeInTheDocument()
  })

  it('membatalkan penghapusan data lokal dengan menutup formulir', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: strings.settings.open }))

    await user.click(screen.getByRole('button', { name: strings.guide.clearLocalData }))
    await user.click(screen.getByRole('button', { name: strings.common.close }))

    expect(screen.queryByLabelText(/Nama panggilan/)).toBeNull()
    expect(useSettingsStore.getState().nickname).toBe('')
  })
})

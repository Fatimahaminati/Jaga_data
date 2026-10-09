import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import type { Decision } from '@/domain/types'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { draftKey } from '@/hooks/useAutosaveDraft'
import HomePage from './HomePage'

function renderPage(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/skenario" element={<p>HALAMAN SKENARIO</p>} />
        <Route path="/latihan/:scenarioId" element={<p>HALAMAN LATIHAN</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function writeDraft(scenarioId: string): void {
  const decisions: Decision[] = [{ segmentId: 's1-01', action: 'remove' }]
  localStorageRepo.write(draftKey(scenarioId), {
    scenarioId,
    decisions,
    hintUsed: false,
    updatedAt: new Date().toISOString(),
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('HomePage — hero & tujuan utama', () => {
  it('menampilkan satu judul utama, pengantar, dan satu tombol utama', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: strings.home.heroTitle }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText(strings.home.heroLead)).toBeInTheDocument()
    expect(screen.getByText(strings.app.builtFor)).toBeInTheDocument()

    const ctas = screen.getAllByRole('link', { name: strings.home.ctaStart })
    expect(ctas).toHaveLength(1)
    expect(ctas[0]).toHaveAttribute('href', '/skenario')
    expect(ctas[0].className).toContain('btn-primary')
    expect(ctas[0].className).toContain('btn-lg')
  })

  it('menavigasi ke halaman skenario saat CTA diklik', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('link', { name: strings.home.ctaStart }))

    expect(screen.getByText('HALAMAN SKENARIO')).toBeInTheDocument()
  })

  it('menampilkan judul bagian langkah dan tiga langkah ringkas', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: strings.home.howTitle })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(strings.home.howSteps.length)
    for (const step of strings.home.howSteps) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
  })

  it('menampilkan baris privasi singkat dan catatan data fiktif', () => {
    renderPage()

    expect(screen.getByText(strings.home.privacyLine)).toBeInTheDocument()
    expect(screen.getByText(strings.app.fictionalNotice)).toBeInTheDocument()
  })
})

describe('HomePage — penjelasan privasi', () => {
  it('menyembunyikan penjelasan panjang sampai tombol diklik', async () => {
    const user = userEvent.setup()
    renderPage()

    const toggle = screen.getByRole('button', { name: strings.common.showMore })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(strings.app.privacyNotice)).not.toBeVisible()

    await user.click(toggle)

    expect(screen.getByRole('button', { name: strings.common.showLess })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText(strings.app.privacyNotice)).toBeVisible()

    await user.click(screen.getByRole('button', { name: strings.common.showLess }))

    expect(screen.getByRole('button', { name: strings.common.showMore })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByText(strings.app.privacyNotice)).not.toBeVisible()
  })

  it('bisa dibuka dan ditutup dengan papan ketik', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.tab()
    await user.tab()
    const toggle = screen.getByRole('button', { name: strings.common.showMore })
    expect(toggle).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByText(strings.app.privacyNotice)).toBeVisible()

    await user.keyboard(' ')
    expect(screen.getByText(strings.app.privacyNotice)).not.toBeVisible()
  })
})

describe('HomePage — draf tersimpan', () => {
  it('menawarkan melanjutkan draf bila ada draf skenario valid', () => {
    writeDraft('perkenalan-diri')

    renderPage()

    const resume = screen.getByRole('link', { name: strings.home.resumeDraftAction })
    expect(resume).toHaveAttribute('href', '/latihan/perkenalan-diri')
    expect(resume.className).toContain('btn-secondary')
    expect(resume.className).not.toContain('btn-primary')
    expect(screen.getByText(strings.home.resumeDraft)).toBeInTheDocument()
  })

  it('mengabaikan draf dengan id skenario yang tidak dikenal', () => {
    writeDraft('skenario-ngawur')

    renderPage()

    expect(screen.queryByRole('link', { name: strings.home.resumeDraftAction })).toBeNull()
    expect(screen.queryByText(strings.home.resumeDraft)).toBeNull()
  })

  it('tidak menampilkan kotak draf bila tidak ada draf sama sekali', () => {
    renderPage()

    expect(screen.queryByText(strings.home.resumeDraft)).toBeNull()
    expect(
      screen.queryByRole('link', { name: strings.home.resumeDraftAction }),
    ).not.toBeInTheDocument()
  })
})

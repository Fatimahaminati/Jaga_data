import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import type { Attempt, ScoreResult } from '@/domain/types'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { KEYS } from '@/infra/storage/StorageRepository'
import { draftKey } from '@/hooks/useAutosaveDraft'
import { useProgressStore } from '@/stores/progressStore'
import ScenariosPage from './ScenariosPage'

function makeResult(total: number): ScoreResult {
  return {
    total,
    privacyScore: total,
    utilityScore: total,
    perSegment: [],
    badge: total >= 80 ? 'penjaga_data' : 'waspada',
  }
}

function makeAttempt(id: string, scenarioId: string, total: number): Attempt {
  return {
    id,
    scenarioId,
    decisions: [],
    result: makeResult(total),
    createdAt: '2026-01-02T03:04:05.000Z',
    durationMs: 45_000,
    hintUsed: false,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/skenario']}>
      <ScenariosPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  useProgressStore.setState({ attempts: [] })
})

describe('ScenariosPage — daftar skenario', () => {
  it('menampilkan judul halaman, satu kalimat pengantar, dan catatan data fiktif', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: strings.scenarios.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(strings.scenarios.subtitle)).toBeInTheDocument()
    expect(screen.getByText(strings.app.fictionalNotice)).toBeInTheDocument()
  })

  it('menampilkan tepat tiga kartu skenario dari konten statis', () => {
    renderPage()

    for (const scenario of scenarios) {
      expect(screen.getByRole('heading', { level: 2, name: scenario.title })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(scenarios.length)
  })

  it('tidak menampilkan daftar tujuan belajar di kartu', () => {
    renderPage()

    expect(screen.queryByText(strings.scenarios.objectives)).toBeNull()
    for (const scenario of scenarios) {
      for (const objective of scenario.learningObjectives) {
        expect(screen.queryByText(objective)).toBeNull()
      }
    }
  })

  it('menandai skenario yang belum pernah dicoba', () => {
    renderPage()

    expect(screen.getAllByText(strings.scenarios.notAttempted)).toHaveLength(scenarios.length)
    expect(screen.getAllByRole('link', { name: /Mulai/ })).toHaveLength(scenarios.length)
    expect(screen.queryByText(/Skor terbaik/)).toBeNull()
  })
})

describe('ScenariosPage — progres & draf', () => {
  it('menampilkan skor terbaik dan jumlah percobaan bila sudah pernah mengerjakan', () => {
    useProgressStore.setState({
      attempts: [makeAttempt('att_1', 'perkenalan-diri', 88)],
    })

    renderPage()

    const stat = screen.getByText(/Skor terbaik/)
    expect(stat).toHaveTextContent('88')
    expect(stat).toHaveTextContent(/1 kali dicoba/)
    expect(screen.getByRole('link', { name: /Lanjutkan/ })).toBeInTheDocument()
    expect(screen.getAllByText(strings.scenarios.notAttempted)).toHaveLength(2)
  })

  it('menampilkan skenario terdraf dengan lencana lanjutkan', () => {
    localStorageRepo.write(draftKey('tugas-dan-curhat'), {
      scenarioId: 'tugas-dan-curhat',
      decisions: [{ segmentId: 's2-01', action: 'keep' }],
      hintUsed: false,
      updatedAt: new Date().toISOString(),
    })

    renderPage()

    expect(screen.getAllByText(strings.home.resumeDraft)).toHaveLength(1)
    const card = screen
      .getByRole('heading', { level: 2, name: scenarios[1].title })
      .closest('li') as HTMLElement
    expect(within(card).getByText(strings.home.resumeDraft)).toBeInTheDocument()
  })

  it('tetap menampilkan skenario statis walau data progress di localStorage rusak', async () => {
    window.localStorage.setItem(KEYS.progress, '{data-rusak-bukan-json')
    await useProgressStore.persist.rehydrate()

    renderPage()

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(scenarios.length)
    expect(screen.getAllByText(strings.scenarios.notAttempted)).toHaveLength(scenarios.length)
    expect(window.localStorage.getItem(KEYS.progress)).toBeNull()
  })
})

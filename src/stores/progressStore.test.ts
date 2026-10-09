import { beforeEach, describe, expect, it } from 'vitest'
import type { Attempt, ScoreResult } from '@/domain/types'
import { STORAGE_SCHEMA_VERSION } from '@/domain/schemas/storage.schema'
import { KEYS } from '@/infra/storage/StorageRepository'
import { attemptsFor, averageScore, bestScoreFor, useProgressStore } from './progressStore'

function makeResult(total: number): ScoreResult {
  return {
    total,
    privacyScore: total,
    utilityScore: total,
    perSegment: [],
    badge: total >= 80 ? 'penjaga_data' : 'pemula',
  }
}

function makeAttempt(id: string, scenarioId = 'perkenalan-diri', total = 70): Attempt {
  return {
    id,
    scenarioId,
    decisions: [],
    result: makeResult(total),
    createdAt: '2026-01-02T03:04:05.000Z',
    durationMs: 60_000,
    hintUsed: false,
  }
}

function readPersisted(): { state: { attempts: Attempt[] }; version: number } {
  const raw = window.localStorage.getItem(KEYS.progress)
  expect(raw).not.toBeNull()
  return JSON.parse(raw ?? '{}') as { state: { attempts: Attempt[] }; version: number }
}

beforeEach(() => {
  window.localStorage.clear()
  useProgressStore.setState({ attempts: [] })
})

describe('aksi progress', () => {
  it('awalnya kosong', () => {
    expect(useProgressStore.getState().attempts).toEqual([])
  })

  it('menambah attempt di urutan paling baru', () => {
    useProgressStore.getState().addAttempt(makeAttempt('att_lama'))
    useProgressStore.getState().addAttempt(makeAttempt('att_baru'))

    expect(useProgressStore.getState().attempts.map((item) => item.id)).toEqual([
      'att_baru',
      'att_lama',
    ])
  })

  it('membatasi riwayat tersimpan maksimal 200 percobaan', () => {
    for (let index = 0; index < 205; index += 1) {
      useProgressStore.getState().addAttempt(makeAttempt(`att_${index}`))
    }

    const { attempts } = useProgressStore.getState()
    expect(attempts).toHaveLength(200)
    expect(attempts[0].id).toBe('att_204')
    expect(attempts[attempts.length - 1]?.id).toBe('att_5')
  })

  it('menghapus satu attempt berdasar id', () => {
    useProgressStore.getState().addAttempt(makeAttempt('att_1'))
    useProgressStore.getState().addAttempt(makeAttempt('att_2'))

    useProgressStore.getState().removeAttempt('att_2')

    expect(useProgressStore.getState().attempts.map((item) => item.id)).toEqual(['att_1'])
  })

  it('menghapus id yang tidak dikenal tanpa mengubah apa pun', () => {
    useProgressStore.getState().addAttempt(makeAttempt('att_1'))

    useProgressStore.getState().removeAttempt('tidak-ada')

    expect(useProgressStore.getState().attempts).toHaveLength(1)
  })

  it('mengosongkan seluruh riwayat', () => {
    useProgressStore.getState().addAttempt(makeAttempt('att_1'))
    useProgressStore.getState().addAttempt(makeAttempt('att_2'))

    useProgressStore.getState().clear()

    expect(useProgressStore.getState().attempts).toEqual([])
  })
})

describe('persist ke localStorage', () => {
  it('menulis ke kunci pdp:progress berisi daftar attempt', () => {
    useProgressStore.getState().addAttempt(makeAttempt('att_1'))

    const persisted = readPersisted()
    expect(persisted.version).toBe(STORAGE_SCHEMA_VERSION)
    expect(persisted.state.attempts).toHaveLength(1)
    expect(persisted.state.attempts[0].id).toBe('att_1')
    expect(KEYS.progress.startsWith('pdp:')).toBe(true)
  })

  it('mengabaikan data tersimpan yang rusak', async () => {
    window.localStorage.setItem(KEYS.progress, '{rusak')

    await useProgressStore.persist.rehydrate()

    expect(useProgressStore.getState().attempts).toEqual([])
    expect(window.localStorage.getItem(KEYS.progress)).toBeNull()
  })

  it('memigrasikan data dari versi skema lama lalu menulis ulangnya', async () => {
    window.localStorage.setItem(
      KEYS.progress,
      JSON.stringify({ state: { attempts: [makeAttempt('att_lama')] }, version: 0 }),
    )

    await useProgressStore.persist.rehydrate()

    expect(useProgressStore.getState().attempts.map((item) => item.id)).toEqual(['att_lama'])
    expect(readPersisted().version).toBe(STORAGE_SCHEMA_VERSION)
  })

  it('memakai data tersimpan apa adanya bila migrasi tidak memungkinkan', async () => {
    window.localStorage.setItem(
      KEYS.progress,
      JSON.stringify({
        state: { attempts: [makeAttempt('att_masa_depan')] },
        version: STORAGE_SCHEMA_VERSION + 1,
      }),
    )

    await useProgressStore.persist.rehydrate()

    expect(useProgressStore.getState().attempts.map((item) => item.id)).toEqual(['att_masa_depan'])
  })
})

describe('pemilih data (murni)', () => {
  const attempts = [
    makeAttempt('a1', 'perkenalan-diri', 80),
    makeAttempt('a2', 'perkenalan-diri', 60),
    makeAttempt('a3', 'tugas-dan-curhat', 95),
  ]

  it('attemptsFor menyaring per skenario', () => {
    expect(attemptsFor(attempts, 'perkenalan-diri')).toHaveLength(2)
    expect(attemptsFor(attempts, 'tugas-dan-curhat')).toHaveLength(1)
    expect(attemptsFor(attempts, 'tidak-ada')).toEqual([])
  })

  it('bestScoreFor mengambil skor tertinggi dan null bila belum pernah', () => {
    expect(bestScoreFor(attempts, 'perkenalan-diri')).toBe(80)
    expect(bestScoreFor(attempts, 'tugas-dan-curhat')).toBe(95)
    expect(bestScoreFor(attempts, 'belum-dicoba')).toBeNull()
    expect(bestScoreFor([], 'perkenalan-diri')).toBeNull()
  })

  it('averageScore menghitung rata-rata dibulatkan satu desimal', () => {
    expect(averageScore([])).toBeNull()
    expect(averageScore([makeAttempt('a1', 'perkenalan-diri', 80)])).toBe(80)
    expect(averageScore(attempts)).toBe(78.3)
  })
})

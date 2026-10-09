import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_SCHEMA_VERSION, progressEnvelopeSchema } from '@/domain/schemas/storage.schema'
import type { Attempt } from '@/domain/types'
import { localStorageRepo } from './localStorageRepo'
import { migrate } from './migrations'
import { repoPersistStorage } from './repoPersistStorage'
import { KEYS } from './StorageRepository'

type ProgressState = { attempts: Attempt[] }

const attempt: Attempt = {
  id: 'att-uji-1',
  scenarioId: 'skenario-uji',
  decisions: [{ segmentId: 'seg-1', action: 'keep' }],
  result: {
    total: 80,
    privacyScore: 90,
    utilityScore: 70,
    perSegment: [],
    badge: 'penjaga_data',
  },
  createdAt: '2026-01-02T03:04:05.000Z',
  durationMs: 65_000,
  hintUsed: false,
}

describe('repoPersistStorage', () => {
  const persist = repoPersistStorage<ProgressState>(progressEnvelopeSchema)

  beforeEach(() => {
    localStorageRepo.clearPrefix('pdp:')
  })

  it('menyimpan dan membaca kembali amplop persist yang valid', async () => {
    const envelope = { state: { attempts: [attempt] }, version: STORAGE_SCHEMA_VERSION }

    await persist.setItem(KEYS.progress, envelope)
    const stored = await persist.getItem(KEYS.progress)

    expect(stored).toEqual(envelope)
  })

  it('mengembalikan null saat kunci belum pernah ditulis (state awal dipakai)', async () => {
    expect(await persist.getItem(KEYS.progress)).toBeNull()
  })

  it('mengembalikan null dan menghapus kunci bila JSON di penyimpanan rusak', async () => {
    localStorage.setItem(KEYS.progress, '{amplop-rusak')

    expect(await persist.getItem(KEYS.progress)).toBeNull()
    expect(localStorage.getItem(KEYS.progress)).toBeNull()
  })

  it('mengembalikan null dan menghapus kunci bila isi state melanggar skema', async () => {
    localStorage.setItem(
      KEYS.progress,
      JSON.stringify({ state: { attempts: 'bukan-daftar' }, version: STORAGE_SCHEMA_VERSION }),
    )

    expect(await persist.getItem(KEYS.progress)).toBeNull()
    expect(localStorage.getItem(KEYS.progress)).toBeNull()
  })

  it('removeItem menghapus data tersimpan', async () => {
    await persist.setItem(KEYS.progress, { state: { attempts: [] }, version: 1 })

    await persist.removeItem(KEYS.progress)

    expect(await persist.getItem(KEYS.progress)).toBeNull()
  })

  it('meneruskan versi amplop lama agar bisa dimigrasikan oleh middleware', async () => {
    localStorage.setItem(KEYS.progress, JSON.stringify({ state: { attempts: [] }, version: 0 }))

    const stored = await persist.getItem(KEYS.progress)
    expect(stored?.version).toBe(0)

    const migrated = migrate(
      { schemaVersion: stored?.version ?? 0, state: stored?.state },
      STORAGE_SCHEMA_VERSION,
    )

    expect(migrated).toEqual({ schemaVersion: STORAGE_SCHEMA_VERSION, state: { attempts: [] } })
  })
})

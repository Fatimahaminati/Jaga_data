import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_SCHEMA_VERSION } from '@/domain/schemas/storage.schema'
import { KEYS } from '@/infra/storage/StorageRepository'
import { FONT_SCALE_VALUE, useSettingsStore, type SettingsState } from './settingsStore'

const DEFAULTS: Partial<SettingsState> = {
  nickname: '',
  fontScale: 'normal',
  highContrast: false,
  hintsEnabled: true,
}

function readPersisted(): { state: Record<string, unknown>; version: number } {
  const raw = window.localStorage.getItem(KEYS.settings)
  expect(raw).not.toBeNull()
  return JSON.parse(raw ?? '{}') as { state: Record<string, unknown>; version: number }
}

function writePersisted(state: unknown, version = STORAGE_SCHEMA_VERSION): void {
  window.localStorage.setItem(KEYS.settings, JSON.stringify({ state, version }))
}

beforeEach(() => {
  window.localStorage.clear()
  useSettingsStore.setState(DEFAULTS)
})

describe('state & aksi', () => {
  it('memiliki nilai awal bawaan', () => {
    const state = useSettingsStore.getState()

    expect(state.nickname).toBe('')
    expect(state.fontScale).toBe('normal')
    expect(state.highContrast).toBe(false)
    expect(state.hintsEnabled).toBe(true)
  })

  it('memotong nickname maksimal 24 karakter', () => {
    useSettingsStore.getState().setNickname('x'.repeat(50))

    expect(useSettingsStore.getState().nickname).toHaveLength(24)
  })

  it('mengubah ukuran font dan kontras tinggi', () => {
    useSettingsStore.getState().setFontScale('xlarge')
    useSettingsStore.getState().toggleHighContrast()

    expect(useSettingsStore.getState().fontScale).toBe('xlarge')
    expect(useSettingsStore.getState().highContrast).toBe(true)
  })

  it('mengaktifkan dan menonaktifkan petunjuk', () => {
    useSettingsStore.getState().toggleHintsEnabled()
    expect(useSettingsStore.getState().hintsEnabled).toBe(false)

    useSettingsStore.getState().toggleHintsEnabled()
    expect(useSettingsStore.getState().hintsEnabled).toBe(true)
  })

  it('menyediakan pemetaan nilai font ke faktor pengali variabel --fs-*', () => {
    expect(FONT_SCALE_VALUE).toEqual({ normal: 1, large: 1.1, xlarge: 1.2 })
  })
})

describe('persist ke localStorage', () => {
  it('menulis ke kunci pdp:settings dengan skema envelope {state, version}', () => {
    useSettingsStore.getState().setNickname('Budi')
    useSettingsStore.getState().setFontScale('large')
    useSettingsStore.getState().toggleHighContrast()

    const persisted = readPersisted()
    expect(persisted.version).toBe(STORAGE_SCHEMA_VERSION)
    expect(persisted.state).toEqual({
      nickname: 'Budi',
      fontScale: FONT_SCALE_VALUE.large,
      highContrast: true,
      hintsEnabled: true,
    })
    expect(KEYS.settings.startsWith('pdp:')).toBe(true)
  })

  it('mengembalikan nilai tersimpan (termasuk rasio font) saat rehydrate', async () => {
    writePersisted({
      nickname: 'Sari',
      fontScale: 1.12,
      highContrast: true,
      hintsEnabled: false,
    })

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState()).toMatchObject({
      nickname: 'Sari',
      fontScale: 'large',
      highContrast: true,
      hintsEnabled: false,
    })
  })

  it('menerjemahkan seluruh rasio font ke enum saat merge', async () => {
    for (const [ratio, expected] of [
      [1, 'normal'],
      [1.1, 'large'], // nilai saat ini (opsi Besar)
      [1.2, 'xlarge'], // nilai saat ini (opsi Sangat besar)
      [1.08, 'large'], // data lama
      [1.15, 'large'], // data lama
      [1.24, 'xlarge'], // data lama
    ] as const) {
      writePersisted({
        nickname: '',
        fontScale: ratio,
        highContrast: false,
        hintsEnabled: true,
      })
      await useSettingsStore.persist.rehydrate()
      expect(useSettingsStore.getState().fontScale).toBe(expected)
    }
  })

  it('mengangkat data versi lama (v0) melalui jalur migrasi', async () => {
    writePersisted({ nickname: 'Lama', fontScale: 1.5, highContrast: true, hintsEnabled: true }, 0)

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().nickname).toBe('Lama')
    expect(useSettingsStore.getState().fontScale).toBe('xlarge')
  })

  it('menghapus data persist yang rusak dan kembali ke nilai aman', async () => {
    useSettingsStore.setState({ nickname: 'Aman', fontScale: 'large', highContrast: true })
    window.localStorage.setItem(KEYS.settings, '{bukan-json-valid')

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().nickname).toBe('')
    expect(useSettingsStore.getState().fontScale).toBe('normal')
    expect(window.localStorage.getItem(KEYS.settings)).toBeNull()
  })

  it('menolak data persist yang lolos JSON tetapi melanggar skema Zod', async () => {
    window.localStorage.setItem(
      KEYS.settings,
      JSON.stringify({ state: { nickname: 123, fontScale: 99 }, version: STORAGE_SCHEMA_VERSION }),
    )

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().nickname).toBe('')
    expect(useSettingsStore.getState().fontScale).toBe('normal')
  })
})

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_SCHEMA_VERSION, settingsEnvelopeSchema } from '@/domain/schemas/storage.schema'
import { migrate } from '@/infra/storage/migrations'
import { repoPersistStorage } from '@/infra/storage/repoPersistStorage'
import { KEYS } from '@/infra/storage/StorageRepository'

export type FontScale = 'normal' | 'large' | 'xlarge'

/**
 * Faktor pengali variabel `--fs-*` (styles/index.css) untuk tiap opsi ukuran teks.
 * Faktor ini TIDAK diterapkan ke ukuran `html` — hanya memperbesar variabel font.
 */
export const FONT_SCALE_VALUE: Record<FontScale, number> = {
  normal: 1,
  large: 1.1,
  xlarge: 1.2,
}

export interface SettingsState {
  nickname: string
  fontScale: FontScale
  highContrast: boolean
  hintsEnabled: boolean
  setNickname: (value: string) => void
  setFontScale: (value: FontScale) => void
  toggleHighContrast: () => void
  toggleHintsEnabled: () => void
}

export type SettingsPersistedState = {
  nickname: string
  fontScale: number
  highContrast: boolean
  hintsEnabled: boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      nickname: '',
      fontScale: 'normal',
      highContrast: false,
      hintsEnabled: true,
      setNickname: (value) => set({ nickname: value.slice(0, 24) }),
      setFontScale: (value) => set({ fontScale: value }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      toggleHintsEnabled: () => set((state) => ({ hintsEnabled: !state.hintsEnabled })),
    }),
    {
      name: KEYS.settings,
      version: STORAGE_SCHEMA_VERSION,
      storage: repoPersistStorage<SettingsPersistedState>(settingsEnvelopeSchema),
      partialize: (state): SettingsPersistedState => ({
        nickname: state.nickname,
        fontScale: FONT_SCALE_VALUE[state.fontScale],
        highContrast: state.highContrast,
        hintsEnabled: state.hintsEnabled,
      }),
      migrate: (persistedState, version) => {
        const migrated = migrate(
          { schemaVersion: version, state: persistedState },
          STORAGE_SCHEMA_VERSION,
        )
        if (!migrated) return persistedState as SettingsPersistedState
        return migrated.state as SettingsPersistedState
      },
      merge: (persisted, current) => {
        const data = (persisted ?? {}) as Partial<SettingsPersistedState>
        // Default = "normal" bila pengguna belum pernah memilih ukuran teks.
        // Nilai tersimpan adalah faktor pengali (1 / 1.1 / 1.2); ambang batas
        // juga menampung data lama (1.12, 1.15, 1.28) agar tetap terbaca benar.
        const fontScale: FontScale =
          typeof data.fontScale !== 'number'
            ? 'normal'
            : data.fontScale >= 1.17
              ? 'xlarge'
              : data.fontScale >= 1.05
                ? 'large'
                : 'normal'
        return {
          ...current,
          nickname: typeof data.nickname === 'string' ? data.nickname : '',
          fontScale,
          highContrast: Boolean(data.highContrast),
          hintsEnabled: data.hintsEnabled === undefined ? true : Boolean(data.hintsEnabled),
        }
      },
    },
  ),
)

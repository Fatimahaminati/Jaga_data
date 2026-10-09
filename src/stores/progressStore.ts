import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_SCHEMA_VERSION, progressEnvelopeSchema } from '@/domain/schemas/storage.schema'
import type { Attempt } from '@/domain/types'
import { migrate } from '@/infra/storage/migrations'
import { repoPersistStorage } from '@/infra/storage/repoPersistStorage'
import { KEYS } from '@/infra/storage/StorageRepository'

export interface ProgressState {
  attempts: Attempt[]
  addAttempt: (attempt: Attempt) => void
  removeAttempt: (id: string) => void
  clear: () => void
}

export type ProgressPersistedState = { attempts: Attempt[] }

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      attempts: [],
      addAttempt: (attempt) =>
        set((state) => ({ attempts: [attempt, ...state.attempts].slice(0, 200) })),
      removeAttempt: (id) =>
        set((state) => ({ attempts: state.attempts.filter((item) => item.id !== id) })),
      clear: () => set({ attempts: [] }),
    }),
    {
      name: KEYS.progress,
      version: STORAGE_SCHEMA_VERSION,
      storage: repoPersistStorage<ProgressPersistedState>(progressEnvelopeSchema),
      partialize: (state): ProgressPersistedState => ({ attempts: state.attempts }),
      migrate: (persistedState, version) => {
        const migrated = migrate(
          { schemaVersion: version, state: persistedState },
          STORAGE_SCHEMA_VERSION,
        )
        // Data tidak bisa dimigrasikan: pakai apa adanya (skema Zod sudah memvalidasi).
        if (!migrated) return persistedState as ProgressPersistedState
        return migrated.state as ProgressPersistedState
      },
    },
  ),
)

/* ————— Pemilih data (fungsi murni, mudah diuji) ————— */

export function attemptsFor(attempts: Attempt[], scenarioId: string): Attempt[] {
  return attempts.filter((attempt) => attempt.scenarioId === scenarioId)
}

export function bestScoreFor(attempts: Attempt[], scenarioId: string): number | null {
  const list = attemptsFor(attempts, scenarioId)
  if (list.length === 0) return null
  return list.reduce((best, item) => Math.max(best, item.result.total), 0)
}

export function averageScore(attempts: Attempt[]): number | null {
  if (attempts.length === 0) return null
  const sum = attempts.reduce((total, item) => total + item.result.total, 0)
  return Math.round((sum / attempts.length) * 10) / 10
}

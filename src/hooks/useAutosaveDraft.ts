import { useEffect } from 'react'
import { draftSchema, type DraftRecord } from '@/domain/schemas/storage.schema'
import type { Decision } from '@/domain/types'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { KEYS } from '@/infra/storage/StorageRepository'

const DEBOUNCE_MS = 400

export function draftKey(scenarioId: string): string {
  return KEYS.draft(scenarioId)
}

export function loadDraft(scenarioId: string): DraftRecord | null {
  return localStorageRepo.read(draftKey(scenarioId), draftSchema)
}

export function clearDraft(scenarioId: string): void {
  localStorageRepo.remove(draftKey(scenarioId))
}

/**
 * Autosave draf keputusan per skenario (debounce) supaya tab yang tertutup
 * tidak menghilangkan pekerjaan siswa.
 */
export function useAutosaveDraft(
  scenarioId: string | null,
  decisions: Decision[],
  hintUsed: boolean,
): void {
  useEffect(() => {
    if (!scenarioId) return

    const timer = window.setTimeout(() => {
      const key = draftKey(scenarioId)
      if (decisions.length === 0) {
        localStorageRepo.remove(key)
        return
      }
      localStorageRepo.write(key, {
        scenarioId,
        decisions,
        hintUsed,
        updatedAt: new Date().toISOString(),
      } satisfies DraftRecord)
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [scenarioId, decisions, hintUsed])
}

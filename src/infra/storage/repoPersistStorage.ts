import type { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { localStorageRepo } from './localStorageRepo'

/**
 * Menyatukan middleware `persist` (zustand) dengan `StorageRepository`.
 * Envelope `{ state, version }` divalidasi Zod setiap kali dibaca,
 * sehingga data korup tidak pernah masuk ke state aplikasi.
 */
export function repoPersistStorage<PersistedState>(
  envelopeSchema: z.ZodType<StorageValue<PersistedState>>,
): PersistStorage<PersistedState> {
  return {
    getItem: (name) => localStorageRepo.read(name, envelopeSchema),
    setItem: (name, value) => localStorageRepo.write(name, value),
    removeItem: (name) => localStorageRepo.remove(name),
  }
}

import type { z } from 'zod'
import { STORAGE_PREFIX, type StorageRepository } from './StorageRepository'

export interface LocalStorageRepoOptions {
  prefix?: string
  /** Untuk pengujian: localStorage buatan. */
  storage?: Storage | null
}

function detectStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    const candidate = window.localStorage
    const probe = `${STORAGE_PREFIX}__probe__`
    candidate.setItem(probe, '1')
    candidate.removeItem(probe)
    return candidate
  } catch {
    // Mode privat, diblokir peramban, atau tidak ada DOM.
    return null
  }
}

/**
 * Implementasi StorageRepository di atas localStorage.
 * - Prefiks kunci `pdp:` agar tidak bentrok dengan aplikasi lain.
 * - Validasi Zod saat dibaca; data rusak di-reset dengan aman (bukan crash).
 * - `QuotaExceededError` dan mode privat ditangani dengan fallback memori.
 */
export function createLocalStorageRepository(
  options: LocalStorageRepoOptions = {},
): StorageRepository {
  const prefix = options.prefix ?? STORAGE_PREFIX
  const memory = new Map<string, string>()
  let cached: Storage | null | undefined = options.storage

  function backend(): Storage | null {
    if (cached === undefined) cached = detectStorage()
    return cached
  }

  function getItem(key: string): string | null {
    const store = backend()
    if (store) {
      try {
        const value = store.getItem(key)
        if (value !== null) return value
      } catch {
        return memory.get(key) ?? null
      }
    }
    // Gagal menulis ke backend tadi → nilai terakhir tersimpan di memori.
    return memory.get(key) ?? null
  }

  function setItem(key: string, value: string): boolean {
    const store = backend()
    if (store) {
      try {
        store.setItem(key, value)
        return true
      } catch {
        // QuotaExceededError / mode privat → fallback memori.
        memory.set(key, value)
        return false
      }
    }
    memory.set(key, value)
    return false
  }

  function removeItem(key: string): void {
    memory.delete(key)
    const store = backend()
    if (!store) return
    try {
      store.removeItem(key)
    } catch {
      // abaikan
    }
  }

  function allKeys(): string[] {
    const result = new Set<string>(memory.keys())
    const store = backend()
    if (store) {
      try {
        for (let i = 0; i < store.length; i += 1) {
          const key = store.key(i)
          if (key) result.add(key)
        }
      } catch {
        // abaikan
      }
    }
    return [...result]
  }

  return {
    isAvailable(): boolean {
      return backend() !== null
    },
    read<T>(key: string, schema: z.ZodType<T>): T | null {
      const raw = getItem(key)
      if (raw === null) return null

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        removeItem(key)
        return null
      }

      const result = schema.safeParse(parsed)
      if (!result.success) {
        removeItem(key)
        return null
      }
      return result.data
    },
    write(key: string, value: unknown): boolean {
      let serialized: string
      try {
        serialized = JSON.stringify(value)
      } catch {
        return false
      }
      return setItem(key, serialized)
    },
    remove(key: string): void {
      removeItem(key)
    },
    listKeys(searchPrefix = prefix): string[] {
      return allKeys()
        .filter((key) => key.startsWith(searchPrefix))
        .sort()
    },
    clearPrefix(searchPrefix = prefix): void {
      for (const key of allKeys()) {
        if (key.startsWith(searchPrefix)) removeItem(key)
      }
    },
  }
}

/** Instansi tunggal yang dipakai aplikasi. */
export const localStorageRepo: StorageRepository = createLocalStorageRepository()

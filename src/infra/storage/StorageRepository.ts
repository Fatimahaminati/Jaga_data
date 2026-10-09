import type { z } from 'zod'

/**
 * Satu-satunya lapisan akses penyimpanan lokal.
 * Semua modul (termasuk store) wajib melalui antarmuka ini agar mudah diuji dan diganti
 * (mis. ke IndexedDB atau dasbor guru kelak).
 */
export interface StorageRepository {
  /** false bila penyimpanan tidak tersedia (mode privat / diblokir peramban). */
  isAvailable(): boolean
  /** Baca + validasi dengan skema Zod. Data rusak → reset & null. */
  read<T>(key: string, schema: z.ZodType<T>): T | null
  /** Tulis nilai (di-serialisasi JSON). false bila gagal (kuota penuh, dsb). */
  write(key: string, value: unknown): boolean
  remove(key: string): void
  listKeys(prefix?: string): string[]
  clearPrefix(prefix: string): void
}

export const STORAGE_PREFIX = 'pdp:'

export const KEYS = {
  progress: `${STORAGE_PREFIX}progress`,
  settings: `${STORAGE_PREFIX}settings`,
  draft: (scenarioId: string) => `${STORAGE_PREFIX}draft:${scenarioId}`,
} as const

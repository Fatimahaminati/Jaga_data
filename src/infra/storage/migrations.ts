/**
 * Migrasi data tersimpan.
 * Setiap kali format berubah: tambah nomor versi, tulis fungsi migrasinya,
 * dan naikkan STORAGE_SCHEMA_VERSION pada `storage.schema.ts`.
 */

export type MigrationFn = (state: Record<string, unknown>) => Record<string, unknown>

/** Kunci = versi TUJUAN migrasi (1 = v0 → v1). */
export const MIGRATIONS: Record<number, MigrationFn> = {
  // v1: format awal, tidak ada perubahan struktur.
  1: (state) => state,
}

export interface VersionedPayload {
  schemaVersion: number
  state: Record<string, unknown>
}

/**
 * Naikkan data ke versi skema terbaru.
 * - Bukan objek / versi lebih baru dari yang dikenal → null (biarkan di-reset aman).
 * - Fungsi migrasi yang hilang → null.
 */
export function migrate(payload: unknown, targetVersion: number): VersionedPayload | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null

  const record = payload as Record<string, unknown>
  const rawVersion = record.schemaVersion
  if (typeof rawVersion !== 'number' || !Number.isInteger(rawVersion)) return null
  if (rawVersion > targetVersion) return null

  const rawState = record.state
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) return null

  let version = rawVersion
  let state = rawState as Record<string, unknown>

  while (version < targetVersion) {
    const step = MIGRATIONS[version + 1]
    if (!step) return null
    state = step(state)
    version += 1
  }

  return { schemaVersion: version, state }
}

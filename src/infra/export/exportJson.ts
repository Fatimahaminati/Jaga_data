import type { Attempt } from '@/domain/types'
import { downloadBlob, fileStamp, safeFilename } from './download'

export interface JsonExportPayload {
  app: string
  exportedAt: string
  notice: string
  attempts: Attempt[]
}

export function buildJsonPayload(attempts: Attempt[]): JsonExportPayload {
  return {
    app: 'pdp-ai-literacy',
    exportedAt: new Date().toISOString(),
    notice:
      'Berkas ini berisi data latihan yang tersimpan lokal di perangkat siswa. Semua data dalam latihan bersifat fiktif.',
    attempts,
  }
}

export function buildJson(attempts: Attempt[]): string {
  return JSON.stringify(buildJsonPayload(attempts), null, 2)
}

/** Ekspor JSON (satu atau semua percobaan). */
export function exportJson(attempts: Attempt[], label = 'hasil'): void {
  const content = buildJson(attempts)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  downloadBlob(blob, `jaga-data_${safeFilename(label)}_${fileStamp()}.json`)
}

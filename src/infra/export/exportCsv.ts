import type { Attempt } from '@/domain/types'
import { downloadBlob, fileStamp } from './download'

const BOM = '\uFEFF'

function escapeCell(value: string | number | boolean): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function csvRow(cells: Array<string | number | boolean>): string {
  return cells.map(escapeCell).join(',')
}

export const CSV_HEADER = [
  'id',
  'waktu',
  'id_skenario',
  'judul_skenario',
  'skor_total',
  'skor_privasi',
  'skor_kegunaan',
  'lencana',
  'petunjuk',
  'durasi_detik',
]

/** Ringkasan riwayat dalam format CSV (dilengkapi BOM agar rapi di Excel). */
export function buildCsv(attempts: Attempt[], titleOf: (scenarioId: string) => string): string {
  const rows = attempts.map((attempt) =>
    csvRow([
      attempt.id,
      attempt.createdAt,
      attempt.scenarioId,
      titleOf(attempt.scenarioId),
      attempt.result.total,
      attempt.result.privacyScore,
      attempt.result.utilityScore,
      attempt.result.badge,
      attempt.hintUsed ? 'ya' : 'tidak',
      Math.round(attempt.durationMs / 1000),
    ]),
  )
  return [BOM + CSV_HEADER.join(','), ...rows].join('\r\n')
}

export function exportCsv(attempts: Attempt[], titleOf: (scenarioId: string) => string): void {
  const blob = new Blob([buildCsv(attempts, titleOf)], {
    type: 'text/csv;charset=utf-8',
  })
  downloadBlob(blob, `jaga-data_riwayat_${fileStamp()}.csv`)
}

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { Attempt } from '@/domain/types'
import { buildCsv, csvRow, CSV_HEADER, exportCsv } from './exportCsv'
import { buildJson, exportJson } from './exportJson'

const attempts: Attempt[] = [
  {
    id: 'att_1',
    scenarioId: 'perkenalan-diri',
    decisions: [],
    result: {
      total: 88.5,
      privacyScore: 95,
      utilityScore: 73.5,
      perSegment: [],
      badge: 'penjaga_data',
    },
    createdAt: '2026-01-02T03:04:05.000Z',
    durationMs: 65_000,
    hintUsed: false,
  },
  {
    id: 'att_2',
    scenarioId: 'tugas-dan-curhat',
    decisions: [],
    result: {
      total: 42,
      privacyScore: 40,
      utilityScore: 47,
      perSegment: [],
      badge: 'pemula',
    },
    createdAt: '2026-01-03T08:00:00.000Z',
    durationMs: 120_000,
    hintUsed: true,
  },
]

const titleOf = (id: string) =>
  id === 'perkenalan-diri' ? 'Memperkenalkan diri, "bersama AI"' : 'Tugas & curhat'

describe('exportCsv', () => {
  it('menghasilkan baris judul dan satu baris per percobaan', () => {
    const csv = buildCsv(attempts, titleOf)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('\uFEFF' + CSV_HEADER.join(','))
    expect(lines).toHaveLength(attempts.length + 1)
    expect(lines[1]).toContain('att_1')
    expect(lines[1]).toContain('88.5')
    expect(lines[2]).toContain('tugas-dan-curhat')
    expect(lines[2]).toContain('pemula')
  })

  it('menandai pemakaian petunjuk dan durasi dalam detik', () => {
    const csv = buildCsv(attempts, titleOf)
    expect(csv).toContain(',tidak,65')
    expect(csv).toContain(',ya,120')
  })

  it('melarikan karakter khusus dengan benar', () => {
    expect(csvRow(['a,b', 'c"d', 'e\nf', 12, true])).toBe('"a,b","c""d","e\nf",12,true')
  })
})

describe('buildJson', () => {
  it('menghasilkan JSON valid yang memuat semua percobaan', () => {
    const parsed = JSON.parse(buildJson(attempts)) as {
      app: string
      attempts: Attempt[]
      notice: string
    }

    expect(parsed.app).toBe('pdp-ai-literacy')
    expect(parsed.attempts).toHaveLength(2)
    expect(parsed.notice).toContain('fiktif')
    expect(parsed.attempts[0].result.total).toBe(88.5)
  })
})

const createObjectURL = vi.fn((_blob: Blob) => 'blob:https://contoh/uji')
const revokeObjectURL = vi.fn((_url: string) => undefined)

describe('unduhan Blob', () => {
  let clickSpy: MockInstance

  beforeEach(() => {
    createObjectURL.mockReset().mockImplementation(() => 'blob:https://contoh/uji')
    revokeObjectURL.mockReset().mockImplementation(() => undefined)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exportCsv membuat Blob CSV lalu mengunduhnya dengan nama berstempel waktu', () => {
    exportCsv(attempts, titleOf)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const [blob] = createObjectURL.mock.calls[0]
    expect(blob.type).toBe('text/csv;charset=utf-8')

    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.getAttribute('download')).toMatch(
      /^jaga-data_riwayat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/,
    )
  })

  it('exportJson mengunduh JSON dengan label bawaan', () => {
    exportJson(attempts)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const [blob] = createObjectURL.mock.calls[0]
    expect(blob.type).toBe('application/json;charset=utf-8')

    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.getAttribute('download')).toMatch(
      /^jaga-data_hasil_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/,
    )
  })

  it('exportJson menormalkan label khusus menjadi nama berkas', () => {
    exportJson([attempts[0]], 'Percobaan Saja!')

    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.getAttribute('download')).toMatch(
      /^jaga-data_percobaan-saja_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/,
    )
  })
})

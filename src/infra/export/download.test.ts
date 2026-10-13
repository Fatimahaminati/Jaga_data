import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { dataUrlToBlob, downloadBlob, fileStamp, safeFilename } from './download'

/** Baca isi Blob dengan FileReader (jsdom 25 tidak menyediakan Blob#text/arrayBuffer). */
function readBytes(blob: Blob): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('gagal membaca Blob'))
    reader.onload = () => resolve([...new Uint8Array(reader.result as ArrayBuffer)])
    reader.readAsArrayBuffer(blob)
  })
}

async function readText(blob: Blob): Promise<string> {
  return new TextDecoder().decode(new Uint8Array(await readBytes(blob)))
}

const createObjectURL = vi.fn((_blob: Blob) => 'blob:https://contoh/uji')
const revokeObjectURL = vi.fn((_url: string) => undefined)

let clickSpy: MockInstance

function stubUrlStatics(): void {
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
}

describe('downloadBlob', () => {
  beforeEach(() => {
    createObjectURL.mockReset().mockImplementation(() => 'blob:https://contoh/uji')
    revokeObjectURL.mockReset().mockImplementation(() => undefined)
    stubUrlStatics()
    vi.useFakeTimers()
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('membuat tautan unduhan, mengekliknya, lalu melepasnya dari DOM', () => {
    const blob = new Blob(['isi fiktif'], { type: 'text/plain' })

    downloadBlob(blob, 'catatan.txt')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.getAttribute('href')).toBe('blob:https://contoh/uji')
    expect(anchor.getAttribute('download')).toBe('catatan.txt')
    expect(anchor.rel).toBe('noopener')
    expect(document.body.contains(anchor)).toBe(false)
  })

  it('mencabut URL object satu detik setelah unduhan dimulai', () => {
    downloadBlob(new Blob(['isi'], { type: 'text/csv' }), 'riwayat.csv')

    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(999)
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:https://contoh/uji')
  })

  it('meneruskan galat bila URL object tidak tersedia', () => {
    createObjectURL.mockImplementationOnce(() => {
      throw new Error('URL.createObjectURL tidak tersedia')
    })

    expect(() => downloadBlob(new Blob(['isi']), 'gagal.txt')).toThrow(
      'URL.createObjectURL tidak tersedia',
    )
    expect(clickSpy).not.toHaveBeenCalled()
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })
})

describe('fileStamp', () => {
  it('memformat tanggal dan jam menjadi stempel nama berkas', () => {
    expect(fileStamp(new Date(2026, 0, 2, 15, 4))).toBe('2026-01-02_15-04')
    expect(fileStamp(new Date(2026, 10, 30, 7, 5))).toBe('2026-11-30_07-05')
  })

  it('menggunakan waktu sekarang bila tanpa argumen', () => {
    expect(fileStamp()).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/)
  })
})

describe('safeFilename', () => {
  it('menormalkan label menjadi nama berkas yang aman', () => {
    expect(safeFilename('Uji Budi & Sari!')).toBe('uji-budi-sari')
    expect(safeFilename('  spasi   ganda  ')).toBe('spasi-ganda')
    expect(safeFilename('Sudah-Aman_2')).toBe('sudah-aman_2')
  })

  it('menghapus tanda baca yang tersisa hingga kosong', () => {
    expect(safeFilename('***')).toBe('')
    expect(safeFilename('---')).toBe('')
  })
})

describe('dataUrlToBlob', () => {
  it('mendecode data URL base64 menjadi Blob dengan byte dan mime yang sama', async () => {
    const raw = 'kartu-hasil-fiktif'
    const blob = dataUrlToBlob(`data:image/png;base64,${btoa(raw)}`)

    expect(blob.type).toBe('image/png')
    expect(await readBytes(blob)).toEqual([...new TextEncoder().encode(raw)])
  })

  it('mendecode data URL ber-parameter tanpa kehilangan mime aslinya', async () => {
    const blob = dataUrlToBlob('data:text/csv;charset=utf-8;base64,' + btoa('a,b;c'))

    expect(blob.type).toBe('text/csv')
    expect(await readText(blob)).toBe('a,b;c')
  })

  it('mengabaikan spasi dan baris baris di dalam isi base64', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,aGVs\nbG8g ZHVuaWE=')

    expect(blob.type).toBe('image/png')
    expect(await readText(blob)).toBe('hello dunia')
  })

  it('mendecode data URL tanpa base64 (persen-encode) sebagai teks', async () => {
    const blob = dataUrlToBlob('data:text/plain;charset=utf-8,halo%20dunia%2C%2088.5')

    expect(blob.type).toBe('text/plain')
    expect(await readText(blob)).toBe('halo dunia, 88.5')
  })

  it('memakai mime bawaan bila data URL tidak menyebutkannya', () => {
    expect(dataUrlToBlob('data:;base64,aGVsbG8=').type).toBe('application/octet-stream')
  })

  it('menolak string yang bukan data URL', () => {
    expect(() => dataUrlToBlob('https://contoh.test/gambar.png')).toThrow(
      'Format data URL tidak dikenali',
    )
    expect(() => dataUrlToBlob('data:image/png;base64')).toThrow('Format data URL tidak dikenali')
    expect(() => dataUrlToBlob('')).toThrow('Format data URL tidak dikenali')
  })
})

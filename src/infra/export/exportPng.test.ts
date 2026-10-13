import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import { downloadBlob } from './download'
import { exportPng } from './exportPng'

vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

/** Bagian modul unduhan yang tetap asli (pembuat nama berkas). */
interface DownloadActual {
  fileStamp: (date?: Date) => string
  safeFilename: (input: string) => string
}

vi.mock('./download', async (importOriginal) => {
  const actual = await importOriginal<DownloadActual>()
  return { ...actual, downloadBlob: vi.fn() }
})

const DATA_URL = 'data:image/png;base64,AAAA'

/** Spy pemantau: ekspor PNG dilarang memakai jaringan (CSP connect-src 'self'). */
const fetchSpy = vi.fn()

beforeEach(() => {
  vi.mocked(toPng).mockReset().mockResolvedValue(DATA_URL)
  vi.mocked(downloadBlob).mockReset()
  fetchSpy.mockReset()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('exportPng', () => {
  it('merender node menjadi PNG lalu mengunduhnya', async () => {
    const node = document.createElement('div')
    node.id = 'kartu-hasil'
    document.body.appendChild(node)

    const filename = await exportPng(node, 'Uji Fiktif 1')

    expect(toPng).toHaveBeenCalledTimes(1)
    expect(toPng).toHaveBeenCalledWith(node, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })
    // Konversi dilakukan lokal (dekode base64) — tidak ada panggilan jaringan,
    // agar tidak melanggar CSP connect-src 'self' di produksi.
    expect(fetchSpy).not.toHaveBeenCalled()

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    const [blob, downloadedName] = vi.mocked(downloadBlob).mock.calls[0]
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(3)
    expect(downloadedName).toBe(filename)
    expect(filename).toMatch(/^jaga-data_uji-fiktif-1_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.png$/)

    node.remove()
  })

  it('meneruskan galat bila rendering gagal', async () => {
    const node = document.createElement('div')
    vi.mocked(toPng).mockRejectedValueOnce(new Error('render gagal'))

    await expect(exportPng(node, 'gagal-render')).rejects.toThrow('render gagal')
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('menolak data URL tak valid tanpa mengunduh berkas apa pun', async () => {
    const node = document.createElement('div')
    vi.mocked(toPng).mockResolvedValueOnce('bukan-data-url')

    await expect(exportPng(node, 'data-url-salah')).rejects.toThrow(
      'Format data URL tidak dikenali',
    )
    expect(downloadBlob).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './download'
import { exportPdf, type PdfDocumentSpec } from './exportPdf'

/** Bagian modul unduhan yang tetap asli (pembuat nama berkas). */
interface DownloadActual {
  fileStamp: (date?: Date) => string
  safeFilename: (input: string) => string
}

vi.mock('./download', async (importOriginal) => {
  const actual = await importOriginal<DownloadActual>()
  return { ...actual, downloadBlob: vi.fn() }
})

/** jsPDF palsu — merekam setiap pemanggilan agar argumennya bisa diperiksa. */
const pdf = vi.hoisted(() => {
  const state = {
    options: [] as unknown[],
    calls: [] as Array<{ fn: string; args: unknown[] }>,
    pages: 1,
    failConstruction: false,
  }

  const record =
    (fn: string) =>
    (...args: unknown[]) => {
      state.calls.push({ fn, args })
    }

  class FakeJsPDF {
    constructor(options: unknown) {
      if (state.failConstruction) throw new Error('jsPDF gagal dimuat')
      state.options.push(options)
    }

    setFillColor = record('setFillColor')
    rect = record('rect')
    setTextColor = record('setTextColor')
    setFont = record('setFont')
    setFontSize = record('setFontSize')
    text = record('text')
    setPage = record('setPage')

    addPage = () => {
      state.calls.push({ fn: 'addPage', args: [] })
      state.pages += 1
    }

    getNumberOfPages = () => {
      state.calls.push({ fn: 'getNumberOfPages', args: [] })
      return state.pages
    }

    splitTextToSize = (text: string): string[] => {
      state.calls.push({ fn: 'splitTextToSize', args: [text] })
      if (text === '') return []
      return text.match(/.{1,16}/g) ?? []
    }

    output = (type: string): Blob => {
      state.calls.push({ fn: 'output', args: [type] })
      return new Blob(['pdf-palsu'], { type: 'application/pdf' })
    }
  }

  return { state, FakeJsPDF }
})

vi.mock('jspdf', () => ({ jsPDF: pdf.FakeJsPDF }))

const spec: PdfDocumentSpec = {
  title: 'Laporan Uji Fiktif',
  subtitle: 'Data latihan siswa — tidak nyata',
  scores: [
    { label: 'Total', value: '88,5' },
    { label: 'Privasi', value: '95' },
    { label: 'Kegunaan', value: '73,5' },
  ],
  meta: [
    { label: 'Skenario', value: 'Perkenalan diri bersama AI' },
    { label: 'Durasi', value: '120 detik' },
    { label: 'Tanpa nilai', value: '' },
  ],
  sectionHeading: 'Ringkasan latihan',
  beforeHeading: 'Pesan sebelum dianalisis',
  afterHeading: 'Pesan setelah dianalisis',
  // Paragraf panjang agar tata letak melewati batas halaman (uji pagu ruang).
  before: 'Pesan fiktif yang panjang untuk menguji aliran halaman. '.repeat(24),
  after: '',
  feedbackHeading: 'Umpan balik guru',
  feedback: [
    {
      verdict: 'TEPAT',
      text: 'Data pribadi berhasil dilindungi.',
      note: 'Pertahankan cara memilih generalisasi.',
    },
    {
      verdict: 'PERLU PERBAIKAN',
      text: 'Sebagian data masih terlalu spesifik.',
      note: 'Gunakan opsi yang lebih umum.',
    },
  ],
  footer: 'Panduan Privasi Data — contoh fiktif',
}

const textCalls = () => pdf.state.calls.filter((call) => call.fn === 'text')
const texts = () => textCalls().map((call) => String(call.args[0]))

beforeEach(() => {
  pdf.state.options.length = 0
  pdf.state.calls.length = 0
  pdf.state.pages = 1
  pdf.state.failConstruction = false
  vi.mocked(downloadBlob).mockReset()
})

describe('exportPdf', () => {
  it('membuat dokumen A4 dan mengunduhnya dengan nama berkas berstempel waktu', async () => {
    await exportPdf(spec, 'Uji Fiktif 1')

    expect(pdf.state.options[0]).toEqual({ unit: 'mm', format: 'a4' })

    const written = texts()
    expect(written).toContain(spec.title)
    expect(written).toContain(spec.subtitle)
    expect(written).toContain('Ringkasan skor')
    expect(written).toContain(spec.sectionHeading)
    expect(written).toContain(spec.beforeHeading)
    expect(written).toContain(spec.afterHeading)
    expect(written).toContain(spec.feedbackHeading)
    expect(written).toContain(spec.footer)

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
    expect(filename).toMatch(/^jaga-data_uji-fiktif-1_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/)
  })

  it('meletakkan kop halaman, label skor, dan baris meta pada posisinya', async () => {
    await exportPdf(spec, 'kop')

    const rectCall = pdf.state.calls.find((call) => call.fn === 'rect')
    expect(rectCall?.args).toEqual([0, 0, 210, 26, 'F'])

    const titleCall = textCalls().find((call) => call.args[0] === spec.title)
    expect(titleCall?.args.slice(1)).toEqual([16, 13])

    // Label skor di kiri (x=16) dan nilainya disejajarkan di x=71.
    for (const score of spec.scores) {
      const labelCall = textCalls().find((call) => call.args[0] === score.label)
      expect(labelCall?.args[2]).toBeGreaterThan(0)
      expect(labelCall?.args[1]).toBe(16)
      const valueCall = textCalls().find(
        (call) => call.args[0] === score.value && call.args[1] === 71,
      )
      expect(valueCall).toBeDefined()
    }

    expect(texts()).toContain('Skenario:')
    expect(texts()).toContain('Durasi:')
    expect(texts()).toContain('Tanpa nilai:')
    // Nilai meta kosong ditulis sebagai string kosong (bukan undefined).
    const emptyMeta = textCalls().find((call) => call.args[0] === '' && call.args[1] === 56)
    expect(emptyMeta).toBeDefined()
  })

  it('membuat halaman baru saat konten melewati batas halaman', async () => {
    await exportPdf(spec, 'pagu')

    const addPageCalls = pdf.state.calls.filter((call) => call.fn === 'addPage')
    expect(addPageCalls.length).toBeGreaterThan(0)

    // Footer dan penomoran ditulis di setiap halaman.
    const footers = textCalls().filter((call) => call.args[0] === spec.footer)
    expect(footers.length).toBe(pdf.state.pages)
    expect(pdf.state.pages).toBeGreaterThan(1)
    const pageNumbers = texts().filter((value) => /^\d+\/\d+$/.test(value))
    expect(pageNumbers).toHaveLength(pdf.state.pages)
  })

  it('melewati bagian umpan balik bila daftar umpan balik kosong', async () => {
    await exportPdf({ ...spec, feedback: [] }, 'tanpa-umpan-balik')

    expect(texts()).not.toContain(spec.feedbackHeading)
    expect(downloadBlob).toHaveBeenCalledTimes(1)
  })

  it('meneruskan galat bila jsPDF gagal dibuat', async () => {
    pdf.state.failConstruction = true

    await expect(exportPdf(spec, 'gagal')).rejects.toThrow('jsPDF gagal dimuat')
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('meneruskan galat bila proses unduhan gagal', async () => {
    vi.mocked(downloadBlob).mockImplementationOnce(() => {
      throw new Error('kuota penyimpanan penuh')
    })

    await expect(exportPdf(spec, 'gagal-unduh')).rejects.toThrow('kuota penyimpanan penuh')
  })
})

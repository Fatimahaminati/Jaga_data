import { downloadBlob, fileStamp, safeFilename } from './download'

export interface PdfScoreLine {
  label: string
  value: string
}

export interface PdfFeedbackItem {
  verdict: string
  text: string
  note: string
}

export interface PdfDocumentSpec {
  title: string
  subtitle: string
  scores: PdfScoreLine[]
  meta: Array<{ label: string; value: string }>
  sectionHeading: string
  beforeHeading: string
  afterHeading: string
  before: string
  after: string
  feedbackHeading: string
  feedback: PdfFeedbackItem[]
  footer: string
}

const BRAND: [number, number, number] = [17, 133, 110]
const INK: [number, number, number] = [51, 57, 69]
const MUTED: [number, number, number] = [102, 115, 140]
const PAGE_MARGIN = 16
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

/**
 * Ekspor ringkasan hasil ke PDF.
 * jsPDF dimuat secara dinamis agar tidak membebani bundle awal.
 */
export async function exportPdf(spec: PdfDocumentSpec, filenameLabel: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  let y = PAGE_MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  const writeWrapped = (
    text: string,
    options: {
      size?: number
      color?: [number, number, number]
      indent?: number
      gap?: number
    } = {},
  ) => {
    const size = options.size ?? 10
    const color = options.color ?? INK
    const indent = options.indent ?? 0
    const gap = options.gap ?? 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent) as string[]
    for (const line of lines) {
      ensureSpace(size * 0.5 + gap)
      doc.text(line, PAGE_MARGIN + indent, y)
      y += size * 0.45 + 1.4
    }
    y += gap
  }

  // Kop halaman
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_WIDTH, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(spec.title, PAGE_MARGIN, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(spec.subtitle, PAGE_MARGIN, 20)
  y = 34

  // Skor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text('Ringkasan skor', PAGE_MARGIN, y)
  y += 6
  for (const score of spec.scores) {
    ensureSpace(6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text(score.label, PAGE_MARGIN, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INK)
    doc.text(score.value, PAGE_MARGIN + 55, y)
    y += 5.5
  }
  y += 2

  // Meta
  for (const item of spec.meta) {
    ensureSpace(6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(`${item.label}:`, PAGE_MARGIN, y)
    doc.setTextColor(...INK)
    const value = doc.splitTextToSize(item.value, CONTENT_WIDTH - 40) as string[]
    doc.text(value[0] ?? '', PAGE_MARGIN + 40, y)
    y += 5
  }
  y += 3

  const heading = (text: string) => {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...BRAND)
    doc.text(text, PAGE_MARGIN, y)
    y += 6
  }

  heading(spec.sectionHeading)
  heading(spec.beforeHeading)
  writeWrapped(spec.before, { size: 9.5, indent: 0, gap: 1 })
  heading(spec.afterHeading)
  writeWrapped(spec.after, { size: 9.5, indent: 0, gap: 3 })

  if (spec.feedback.length > 0) {
    heading(spec.feedbackHeading)
    for (const item of spec.feedback) {
      ensureSpace(14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...INK)
      doc.text(`[${item.verdict}]`, PAGE_MARGIN, y)
      y += 5
      writeWrapped(item.text, { size: 9.5, indent: 4, gap: 0.5 })
      writeWrapped(item.note, { size: 9, color: MUTED, indent: 4, gap: 2.5 })
    }
  }

  // Footer pada tiap halaman
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(spec.footer, PAGE_MARGIN, PAGE_HEIGHT - 10)
    doc.text(`${page}/${pages}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 10, {
      align: 'right',
    })
  }

  downloadBlob(doc.output('blob'), `jaga-data_${safeFilename(filenameLabel)}_${fileStamp()}.pdf`)
}

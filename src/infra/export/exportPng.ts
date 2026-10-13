import { dataUrlToBlob, downloadBlob, fileStamp, safeFilename } from './download'

/**
 * Ekspor kartu hasil ke PNG.
 * html-to-image dimuat secara dinamis agar bundle awal tetap kecil.
 */
export async function exportPng(node: HTMLElement, filenameLabel: string): Promise<string> {
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })

  const filename = `jaga-data_${safeFilename(filenameLabel)}_${fileStamp()}.png`
  // Dilarang `fetch(dataUrl)`: CSP connect-src 'self' memblokir data: di produksi.
  const blob = dataUrlToBlob(dataUrl)
  downloadBlob(blob, filename)
  return filename
}

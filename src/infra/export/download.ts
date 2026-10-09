/** Utilitas unduhan berbasis Blob — semuanya berjalan di sisi klien. */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Beri waktu peramban memulai unduhan sebelum URL dicabut.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Stempel waktu aman untuk nama berkas, mis. `2026-01-02_15-04`. */
export function fileStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}-${pad(date.getMinutes())}`,
  ].join('_')
}

export function safeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

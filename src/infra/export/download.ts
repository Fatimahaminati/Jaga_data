/** Utilitas unduhan berbasis Blob — semuanya berjalan di sisi klien. */

/**
 * Ubah data URL (mis. hasil `html-to-image`/`canvas.toDataURL`) menjadi Blob
 * **tanpa menyentuh jaringan**.
 *
 * `fetch(dataUrl)` diblokir CSP `connect-src 'self'` sehingga ekspor PNG gagal
 * di produksi; dekode base64 manual ini setara hasilnya dan sepenuhnya lokal.
 *
 * @throws {Error} bila bukan data URL berformat `data:<mime>,<isi>`.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const matched = /^data:([^,]*),([\s\S]*)$/.exec(dataUrl)
  if (!matched) {
    throw new Error('Format data URL tidak dikenali (harus "data:<mime>,<isi>")')
  }

  const [, header, payload] = matched
  const [mime, ...params] = header.split(';')
  const type = mime.trim() || 'application/octet-stream'
  const isBase64 = params.some((param) => param.trim().toLowerCase() === 'base64')

  if (!isBase64) {
    return new Blob([decodeURIComponent(payload)], { type })
  }

  // Spasi/baris baris kadang diselipkan pemilik data URL — buang dulu.
  const binary = atob(payload.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type })
}

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

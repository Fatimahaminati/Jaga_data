// Hitung ukuran payload awal (gzip) dari dist/index.html — alat bantu laporan pengujian.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const files = [...html.matchAll(/assets\/[^"']+/g)].map((m) => m[0])

let total = Buffer.byteLength(html)
console.log('index.html'.padEnd(42), (Buffer.byteLength(html) / 1024).toFixed(1), 'KB gzip(asli)')
for (const f of files) {
  const buf = readFileSync(join(dist, f))
  const gz = gzipSync(buf).length
  total += gz
  console.log(
    f.padEnd(42),
    (buf.length / 1024).toFixed(1),
    'KB raw ->',
    (gz / 1024).toFixed(1),
    'KB gzip',
  )
}
console.log('TOTAL payload awal (gzip):', (total / 1024).toFixed(1), 'KB')

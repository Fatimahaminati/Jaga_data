// Agregasi coverage per kelompok dari coverage/coverage-summary.json
import { readFileSync } from 'node:fs'

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'))
const groups = new Map()

for (const [file, v] of Object.entries(summary)) {
  if (file === 'total') continue
  const norm = file.replace(/\\/g, '/')
  const m = norm.match(/\/src\/([^/]+)\//)
  const key = m ? `src/${m[1]}` : 'root'
  const g = groups.get(key) ?? { lc: 0, lt: 0, bc: 0, bt: 0, fc: 0, ft: 0 }
  g.lc += v.lines.covered
  g.lt += v.lines.total
  g.bc += v.branches.covered
  g.bt += v.branches.total
  g.fc += v.functions.covered
  g.ft += v.functions.total
  groups.set(key, g)
}

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) : '100.00')
for (const [key, g] of [...groups].sort()) {
  console.log(key.padEnd(16), pct(g.lc, g.lt), pct(g.bc, g.bt), pct(g.fc, g.ft))
}
console.log(
  'TOTAL'.padEnd(16),
  summary.total.lines.pct,
  summary.total.branches.pct,
  summary.total.functions.pct,
  summary.total.statements.pct,
)

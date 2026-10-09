import type { Decision, Scenario } from '../types'

export type PreviewPartKind = 'unchanged' | 'kept' | 'removed' | 'generalized'

export interface PreviewPart {
  segmentId: string
  /** Teks asli segmen. */
  original: string
  /** Teks akhir setelah keputusan (string kosong bila dihapus). */
  text: string
  kind: PreviewPartKind
}

export interface Preview {
  /** Pesan sebelum disunting (apa adanya). */
  before: string
  /** Pesan sesudah disunting (segmen terhapus dibuang). */
  after: string
  parts: PreviewPart[]
}

function kindFor(decision: Decision | undefined): PreviewPartKind {
  if (!decision) return 'unchanged'
  if (decision.action === 'keep') return 'kept'
  if (decision.action === 'remove') return 'removed'
  return 'generalized'
}

/**
 * Membangun tampilan "Sebelum" dan "Sesudah" dari keputusan siswa.
 * Murni fungsi: tidak ada efek samping, aman dipanggil ulang (real-time).
 */
export function buildPreview(scenario: Scenario, decisions: Decision[]): Preview {
  const bySegment = new Map<string, Decision>()
  for (const decision of decisions) {
    bySegment.set(decision.segmentId, decision)
  }

  const parts: PreviewPart[] = scenario.segments.map((segment) => {
    const decision = bySegment.get(segment.id)
    const kind = kindFor(decision)
    let text = segment.text

    if (kind === 'removed') {
      text = ''
    } else if (kind === 'generalized') {
      const option = segment.options.find((o) => o.id === decision?.optionId)
      text = option ? option.label : segment.text
    }

    return { segmentId: segment.id, original: segment.text, text, kind }
  })

  const before = parts.map((p) => p.original).join(' ')
  const after = parts
    .filter((p) => p.kind !== 'removed')
    .map((p) => p.text)
    .join(' ')

  return { before, after, parts }
}

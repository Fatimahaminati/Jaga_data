import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { strings } from '@/content/strings/id'
import type { Decision, Scenario, Segment } from '@/domain/types'
import { Button } from '@/components/ui/Button'
import { ActionPopover } from './ActionPopover'

export interface TokenEditorProps {
  scenario: Scenario
  decisions: Decision[]
  hintActive: boolean
  onChange: (decision: Decision) => void
  onClear: (segmentId: string) => void
}

/** Jumlah segmen per bagian supaya layar tidak penuh teks sekaligus. */
export const SEGMENTS_PER_SECTION = 3

function splitSections(segments: Segment[]): Segment[][] {
  const sections: Segment[][] = []
  for (let index = 0; index < segments.length; index += SEGMENTS_PER_SECTION) {
    sections.push(segments.slice(index, index + SEGMENTS_PER_SECTION))
  }
  return sections
}

/**
 * Editor token: pesan dibagi jadi beberapa bagian, tiap bagian hanya
 * menampilkan segmen yang sedang diperiksa. Setiap potongan pesan adalah
 * tombol yang bisa diklik; semua segmen (termasuk yang bukan data pribadi)
 * tampil seragam sehingga siswa harus menemukan sendiri data pribadinya.
 */
export function TokenEditor({
  scenario,
  decisions,
  hintActive,
  onChange,
  onClear,
}: TokenEditorProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [sectionIndex, setSectionIndex] = useState(0)

  const sections = useMemo(() => splitSections(scenario.segments), [scenario.segments])
  const current = Math.max(0, Math.min(sectionIndex, sections.length - 1))
  const visible = sections[current] ?? []

  const goToSection = (next: number) => {
    setOpenId(null)
    setSectionIndex(next)
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="fs-body font-bold text-ink-800">
          {strings.practice.sectionOf(current + 1, sections.length)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<ChevronLeft size={18} aria-hidden />}
            disabled={current === 0}
            onClick={() => goToSection(current - 1)}
          >
            {strings.common.back}
          </Button>
          <Button
            variant="secondary"
            icon={<ChevronRight size={18} aria-hidden />}
            disabled={current >= sections.length - 1}
            onClick={() => goToSection(current + 1)}
          >
            {strings.common.next}
          </Button>
        </div>
      </div>

      <p className="fs-body text-ink-600">{strings.practice.instruction}</p>

      <div role="group" aria-label={strings.practice.messageTitle} className="grid gap-2">
        {visible.map((segment) => {
          const index = scenario.segments.findIndex((item) => item.id === segment.id)
          const before = index > 0 ? scenario.segments[index - 1]?.text : undefined
          const after =
            index >= 0 && index < scenario.segments.length - 1
              ? scenario.segments[index + 1]?.text
              : undefined
          return (
            <ActionPopover
              key={segment.id}
              segment={segment}
              contextBefore={before}
              contextAfter={after}
              decision={decisions.find((item) => item.segmentId === segment.id)}
              hintActive={hintActive}
              open={openId === segment.id}
              onOpenChange={(open) => setOpenId(open ? segment.id : null)}
              onChange={onChange}
              onClear={onClear}
            />
          )
        })}
      </div>
    </div>
  )
}

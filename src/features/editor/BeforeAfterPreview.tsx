import { strings } from '@/content/strings/id'
import type { Preview } from '@/domain/preview/buildPreview'
import type { Verdict } from '@/domain/types'
import { Tabs } from '@/components/ui/Tabs'
import { cx } from '@/utils/cx'

export interface BeforeAfterPreviewProps {
  preview: Preview
  /** Diisi di halaman hasil untuk menandai segmen benar/sebagian/keliru. */
  verdicts?: Record<string, Verdict>
}

function spanClass(kind: string, verdict?: Verdict): string {
  return cx(
    kind === 'removed' && 'preview-removed',
    kind === 'generalized' && 'preview-generalized',
    kind === 'kept' && !verdict && 'preview-kept',
    verdict === 'correct' && 'border-b-2 border-brand-400 bg-brand-50/70',
    verdict === 'partial' && 'border-b-2 border-amber-400 bg-amber-50',
    verdict === 'wrong' && 'border-b-2 border-accent-400 bg-accent-50',
  )
}

function Before({ preview }: { preview: Preview }) {
  return (
    <p className="preview-text" aria-label={strings.preview.beforeAria}>
      {preview.parts.map((part) => (
        <span key={part.segmentId}>{part.original} </span>
      ))}
    </p>
  )
}

function After({ preview, verdicts }: BeforeAfterPreviewProps) {
  const isEmpty = preview.parts.every((part) => part.kind === 'removed')

  return (
    <>
      <p className="preview-text" aria-label={strings.preview.afterAria} aria-live="polite">
        {preview.parts.map((part) => {
          const verdict = verdicts?.[part.segmentId]
          const text = part.kind === 'removed' ? part.original : part.text
          return (
            <span key={part.segmentId} className={spanClass(part.kind, verdict)}>
              {text}{' '}
            </span>
          )
        })}
      </p>
      {isEmpty && (
        <p className="mt-2 rounded-xl bg-accent-50 p-3 fs-small text-accent-800" role="status">
          {strings.preview.emptyAfter}
        </p>
      )}
    </>
  )
}

/**
 * Panel Sebelum/Sesudah lewat tab: satu panel pada satu waktu supaya layar
 * tidak padat. Diperbarui real-time mengikuti keputusan siswa.
 */
export function BeforeAfterPreview(props: BeforeAfterPreviewProps) {
  const { preview } = props

  return (
    <section aria-label={strings.preview.title}>
      <h2 className="label-caps mb-2">{strings.preview.title}</h2>

      <Tabs
        label={strings.preview.title}
        className="[&_[role=tab]]:min-h-[44px]"
        items={[
          {
            value: 'before',
            label: strings.preview.tabBefore,
            content: (
              <div className="surface p-4">
                <Before preview={preview} />
              </div>
            ),
          },
          {
            value: 'after',
            label: strings.preview.tabAfter,
            content: (
              <div className="surface p-4">
                <After {...props} />
              </div>
            ),
          },
        ]}
      />
    </section>
  )
}

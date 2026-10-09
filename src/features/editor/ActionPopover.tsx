import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  Check,
  ChevronDown,
  Replace,
  Shield,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import type { Action, Decision, GeneralizeOption, Segment } from '@/domain/types'
import { cx } from '@/utils/cx'

export interface ActionPopoverProps {
  segment: Segment
  /** Teks segmen sebelumnya — konteks kalimat untuk pratinjau. */
  contextBefore?: string
  /** Teks segmen sesudahnya — konteks kalimat untuk pratinjau. */
  contextAfter?: string
  decision: Decision | undefined
  hintActive: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (decision: Decision) => void
  onClear: (segmentId: string) => void
}

const STATUS_LABEL: Record<Action, string> = {
  keep: strings.action.keep,
  remove: strings.action.remove,
  generalize: strings.action.generalize,
}

/** Penanda kualitas: ikon + warna + teks (tidak mengandalkan warna saja). */
const QUALITY_STYLE: Record<
  GeneralizeOption['quality'],
  { className: string; Icon: typeof ShieldCheck }
> = {
  poor: { className: 'bg-accent-100 text-accent-800', Icon: TriangleAlert },
  acceptable: { className: 'bg-amber-100 text-amber-800', Icon: Shield },
  good: { className: 'bg-brand-100 text-brand-800', Icon: ShieldCheck },
}

export function ActionPopover({
  segment,
  contextBefore,
  contextAfter,
  decision,
  hintActive,
  open,
  onOpenChange,
  onChange,
  onClear,
}: ActionPopoverProps) {
  const [pickingOption, setPickingOption] = useState(false)
  /** Opsi yang dipilih siswa tetapi BELUM dikonfirmasi. */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Opsi yang sedang disorot/difokuskan (untuk pratinjau sebelum memilih). */
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Selaraskan pilihan lokal dengan keputusan tersimpan tiap kali popover dibuka.
  useEffect(() => {
    if (!open) return
    const stored = decision?.action === 'generalize' ? (decision.optionId ?? null) : null
    setSelectedId(stored)
    setHoveredId(null)
    setPickingOption(Boolean(stored))
  }, [open, decision])

  const statusText = decision ? STATUS_LABEL[decision.action] : strings.practice.untouched

  const close = () => {
    setPickingOption(false)
    setHoveredId(null)
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setPickingOption(false)
    onOpenChange(next)
  }

  const pick = (action: Action, optionId?: string) => {
    onChange({ segmentId: segment.id, action, optionId })
    close()
  }

  const confirmOption = () => {
    if (!selectedId) return
    pick('generalize', selectedId)
  }

  const showOptions = pickingOption || decision?.action === 'generalize'
  const activeId = hoveredId ?? selectedId
  const activeOption = showOptions
    ? segment.options.find((option) => option.id === activeId)
    : undefined

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="segment"
          data-selected={open ? 'true' : 'false'}
          data-decision={decision?.action ?? 'none'}
          data-hint={hintActive ? 'true' : 'false'}
          aria-label={`${strings.practice.segmentAria(segment.text)} — ${statusText}`}
        >
          <span className="segment-text flex-1">{segment.text}</span>
          <span className="mt-0.5 flex shrink-0 items-center gap-1.5 fs-small font-semibold">
            {decision?.action === 'keep' && (
              <Check size={16} className="text-brand-600" aria-hidden />
            )}
            {decision?.action === 'remove' && (
              <Trash2 size={16} className="text-ink-500" aria-hidden />
            )}
            {decision?.action === 'generalize' && (
              <Replace size={16} className="text-accent-600" aria-hidden />
            )}
            <ChevronDown size={16} className="text-ink-500" aria-hidden />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          collisionPadding={12}
          align="start"
          aria-label={strings.a11y.popover}
          className="action-popover z-50 w-[min(92vw,26rem)] rounded-2xl border border-ink-200 bg-white p-4 shadow-pop animate-pop-in"
        >
          <p className="label-caps">{strings.action.title}</p>
          <p className="mt-1 fs-body text-ink-700">“{segment.text}”</p>

          <div className="mt-3 grid gap-2">
            <ActionButton
              icon={<Check size={16} aria-hidden />}
              title={strings.action.keep}
              hint={strings.action.keepHint}
              active={decision?.action === 'keep'}
              onClick={() => pick('keep')}
            />
            <ActionButton
              icon={<Trash2 size={16} aria-hidden />}
              title={strings.action.remove}
              hint={strings.action.removeHint}
              active={decision?.action === 'remove'}
              onClick={() => pick('remove')}
            />
            <ActionButton
              icon={<Replace size={16} aria-hidden />}
              title={strings.action.generalize}
              hint={strings.action.generalizeHint}
              active={decision?.action === 'generalize'}
              onClick={() => setPickingOption(true)}
            />
          </div>

          {showOptions && (
            <div className="mt-3 rounded-xl bg-ink-50 p-3">
              <p className="label-caps">{strings.action.chooseReplacement}</p>

              {/* Opsi disusun dari paling spesifik ke paling umum (tangga keumuman). */}
              <ul className="mt-2 grid gap-2">
                {segment.options.map((option) => {
                  const selected = selectedId === option.id
                  const quality = QUALITY_STYLE[option.quality]
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedId(option.id)}
                        onMouseEnter={() => setHoveredId(option.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(option.id)}
                        onBlur={() => setHoveredId(null)}
                        className={cx(
                          'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                          selected
                            ? 'border-accent-500 bg-accent-50'
                            : 'border-ink-200 bg-white hover:border-accent-300',
                        )}
                      >
                        <span className="fs-body text-ink-800">{option.label}</span>
                        {/* Penanda kualitas hanya muncul SETELAH siswa memilih. */}
                        {selected && (
                          <span className={cx('pill shrink-0', quality.className)}>
                            <quality.Icon size={14} aria-hidden />
                            {strings.action.quality[option.quality]}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* Pratinjau kalimat jadinya. Kotaknya selalu tampil dengan tinggi
                  tetap (teks dasar selama belum ada opsi disorot) agar munculnya
                  pratinjau tidak mengubah ukuran popover — perubahan ukuran itu
                  yang membuat popover dihitung ulang dan kedap-kedip. */}
              <div className="mt-3 rounded-xl border border-ink-200 bg-white p-3" role="status">
                <p className="label-caps">{strings.action.sentencePreview}</p>
                <p
                  className={cx(
                    'preview-body mt-1 fs-body',
                    activeOption ? 'text-ink-800' : 'text-ink-500',
                  )}
                >
                  {activeOption ? (
                    <>
                      {contextBefore ? `${contextBefore} ` : null}
                      <span className="preview-generalized">{activeOption.label}</span>
                      {contextAfter ? ` ${contextAfter}` : null}
                    </>
                  ) : (
                    strings.action.previewHint
                  )}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary mt-3 w-full"
                disabled={!selectedId}
                onClick={confirmOption}
              >
                {strings.action.useOption}
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              className="min-h-[44px] rounded-lg px-3 fs-button font-semibold text-ink-500 hover:bg-ink-100"
              onClick={close}
            >
              {strings.common.close}
            </button>
            {decision && (
              <button
                type="button"
                className="min-h-[44px] rounded-lg px-3 fs-button font-semibold text-accent-700 hover:bg-accent-50"
                onClick={() => {
                  onClear(segment.id)
                  close()
                }}
              >
                {strings.action.clear}
              </button>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function ActionButton({
  icon,
  title,
  hint,
  active,
  onClick,
}: {
  icon: ReactNode
  title: string
  hint: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'flex min-h-[48px] w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
        active ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300',
      )}
    >
      <span className={cx('mt-0.5', active ? 'text-brand-700' : 'text-ink-500')}>{icon}</span>
      <span>
        <span className="block fs-body font-semibold text-ink-900">{title}</span>
        <span className="block fs-small text-ink-500">{hint}</span>
      </span>
    </button>
  )
}

import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import { cx } from '@/utils/cx'

export interface DisclosureProps {
  /** Judul bagian — selalu terlihat walau isinya tersembunyi. */
  title: ReactNode
  /** Ikon dekoratif di depan judul (beri `aria-hidden`). */
  icon?: ReactNode
  children: ReactNode
  /** Buka sejak awal (untuk kasus istimewa). */
  defaultOpen?: boolean
}

/**
 * Accordion sederhana: judul + tombol "Lihat penjelasan" / "Sembunyikan".
 * Tombol memakai `aria-expanded` + `aria-controls` dan bisa dioperasikan
 * keyboard (Enter/Space bawaan tombol) serta sentuh (target ≥44px dari `.btn`).
 */
export function Disclosure({ title, icon, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const headingId = `${id}-heading`
  const panelId = `${id}-panel`

  return (
    <section aria-labelledby={headingId} className="surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 font-extrabold text-ink-900">
          {icon}
          {title}
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="btn btn-ghost"
        >
          {open ? strings.common.showLess : strings.common.showMore}
          <ChevronDown
            size={18}
            aria-hidden
            className={cx('transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      <div id={panelId} hidden={!open} className="mt-4">
        {children}
      </div>
    </section>
  )
}

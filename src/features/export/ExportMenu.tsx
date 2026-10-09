import { Download, FileJson, FileSpreadsheet, FileType, ImageDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import { cx } from '@/utils/cx'

export interface ExportItem {
  id: string
  label: string
  /** Ikon opsional; menu sudah punya ikon bawaan berdasarkan `id`. */
  icon?: ReactNode
  run: () => void | Promise<void>
}

export interface ExportMenuProps {
  items: ExportItem[]
  label?: string
  align?: 'start' | 'end'
}

const ICONS: Record<string, ReactNode> = {
  json: <FileJson size={16} aria-hidden />,
  csv: <FileSpreadsheet size={16} aria-hidden />,
  pdf: <FileType size={16} aria-hidden />,
  png: <ImageDown size={16} aria-hidden />,
}

/**
 * Menu ekspor — semua proses berjalan di perangkat siswa (tidak ada unggahan).
 */
export function ExportMenu({ items, label, align = 'start' }: ExportMenuProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const handleRun = async (item: ExportItem) => {
    if (busyId) return
    setBusyId(item.id)
    setMessage(strings.export.preparing)
    try {
      await item.run()
      const name = item.label.replace(/[()]/g, '').trim()
      setMessage(strings.export.success(name))
    } catch {
      setMessage(strings.export.failed)
    } finally {
      setBusyId(null)
    }
  }

  if (items.length === 0) {
    return <p className="fs-small text-ink-500">{strings.export.disabledHistory}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <ul
        className={cx('flex flex-wrap gap-2', align === 'end' && 'justify-end')}
        aria-label={label}
      >
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busyId !== null}
              onClick={() => void handleRun(item)}
            >
              {item.icon ?? ICONS[item.id] ?? <Download size={16} aria-hidden />}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="fs-small text-ink-500" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import { cx } from '@/utils/cx'

const Root = DialogPrimitive.Root
const Trigger = DialogPrimitive.Trigger
const Close = DialogPrimitive.Close

export interface DialogContentProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

function Content({ title, description, children, className }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-fade-in bg-ink-950/50" />
      <DialogPrimitive.Content
        className={cx(
          'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-pop animate-pop-in',
          className,
        )}
      >
        <DialogPrimitive.Title className="pr-8 font-bold text-ink-900">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-1 pr-8 fs-small text-ink-600">
          {description ?? title}
        </DialogPrimitive.Description>
        <div className="mt-4">{children}</div>
        <DialogPrimitive.Close
          aria-label={strings.a11y.closeDialog}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-100 hover:text-ink-800"
        >
          <X size={18} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const Dialog = { Root, Trigger, Content, Close }

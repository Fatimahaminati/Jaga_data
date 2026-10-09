import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'

export interface TabItem {
  value: string
  label: string
  content: ReactNode
}

export function Tabs({
  items,
  label,
  className,
}: {
  items: TabItem[]
  label: string
  className?: string
}) {
  const [first] = items
  return (
    <TabsPrimitive.Root defaultValue={first?.value} className={cx('w-full', className)}>
      <TabsPrimitive.List aria-label={label} className="flex gap-1 rounded-xl bg-ink-100 p-1">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className="min-h-[40px] flex-1 rounded-lg px-3 py-2 fs-button font-semibold text-ink-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm"
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="mt-3 rounded-xl bg-white focus-visible:outline-none"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

import { Lightbulb, LightbulbOff } from 'lucide-react'
import { strings } from '@/content/strings/id'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'

export interface HintToggleProps {
  active: boolean
  onToggle: () => void
}

/** Mode petunjuk: menyorot area berisiko, dengan konsekuensi pengurangan skor. */
export function HintToggle({ active, onToggle }: HintToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={active ? 'primary' : 'secondary'}
        icon={active ? <Lightbulb size={16} aria-hidden /> : <LightbulbOff size={16} aria-hidden />}
        aria-pressed={active}
        onClick={onToggle}
      >
        {active ? strings.practice.hintOff : strings.practice.hint}
      </Button>
      {active && <Pill tone="amber">{strings.practice.hintBadge}</Pill>}
    </div>
  )
}

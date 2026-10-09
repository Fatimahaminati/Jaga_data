import { GraduationCap, Lightbulb, ListChecks, Lock, Shapes } from 'lucide-react'
import { useState } from 'react'
import { strings } from '@/content/strings/id'
import { tips } from '@/content/tips'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SettingsForm } from '@/components/layout/SettingsForm'
import { Disclosure } from '@/features/disclosure/Disclosure'

/**
 * Judul tips tinggal di `content/tips.ts` (di luar kamus strings dan belum boleh diubah).
 * Agar bahasa di layar tetap sederhana, bagian di dalam kurung dibuang saat tampil.
 */
function plainTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)/g, '').trim()
}

export default function GuidePage() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-extrabold text-ink-900">{strings.guide.title}</h1>
        <p className="max-w-2xl fs-body leading-relaxed text-ink-600">{strings.guide.subtitle}</p>
      </header>

      <Disclosure
        title={strings.guide.howToTitle}
        icon={<ListChecks size={18} className="text-brand-600" aria-hidden />}
      >
        <ol className="grid gap-3">
          {strings.guide.howToSteps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-ink-200 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 fs-body font-extrabold text-brand-800">
                {index + 1}
              </span>
              <span className="fs-body leading-relaxed text-ink-700">{step}</span>
            </li>
          ))}
        </ol>
      </Disclosure>

      <Disclosure
        title={strings.guide.conceptsTitle}
        icon={<Shapes size={18} className="text-brand-600" aria-hidden />}
      >
        <ul className="grid gap-3">
          {strings.guide.concepts.map((concept) => (
            <li key={concept.title} className="rounded-xl border border-ink-200 p-4">
              <h3 className="font-bold text-ink-900">{concept.title}</h3>
              <p className="mt-1 fs-body leading-relaxed text-ink-600">{concept.body}</p>
            </li>
          ))}
        </ul>
      </Disclosure>

      <Disclosure
        title={strings.guide.tipsTitle}
        icon={<Lightbulb size={18} className="text-amber-500" aria-hidden />}
      >
        <ul className="grid gap-3">
          {tips.map((tip) => (
            <li key={tip.id} className="rounded-xl border border-ink-200 p-4">
              <h3 className="font-bold text-ink-900">{plainTitle(tip.title)}</h3>
              <p className="mt-1 fs-body leading-relaxed text-ink-600">{tip.body}</p>
            </li>
          ))}
        </ul>
      </Disclosure>

      <section aria-labelledby="untuk-guru" className="surface p-6">
        <h2 id="untuk-guru" className="flex items-center gap-2 font-extrabold text-ink-900">
          <GraduationCap size={18} className="text-brand-600" aria-hidden />
          {strings.guide.teacherTitle}
        </h2>
        <p className="mt-3 fs-body leading-relaxed text-ink-700">{strings.guide.teacherBody}</p>
        <p className="mt-3 flex items-start gap-3 rounded-xl bg-brand-50 p-3 fs-body leading-relaxed text-brand-900">
          <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
          {strings.app.privacyNotice}
        </p>
      </section>

      <section aria-labelledby="pengaturan" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pengaturan" className="font-extrabold text-ink-900">
            {strings.guide.settingsTitle}
          </h2>
          <Button
            variant="secondary"
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            aria-controls="form-pengaturan"
          >
            {showSettings ? strings.common.close : strings.settings.open}
          </Button>
        </div>
        {showSettings && (
          <Card className="p-5" id="form-pengaturan">
            <SettingsForm />
          </Card>
        )}
      </section>
    </div>
  )
}

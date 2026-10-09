import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Eraser,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { scenarios } from '@/content/scenarios'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { Pill } from '@/components/ui/Pill'

/** Ikon tiap langkah, seurutan dengan `strings.home.howSteps`. */
const STEP_ICONS = [LayoutGrid, Eraser, BarChart3]

export default function HomePage() {
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false)
  const privacyDetailId = useId()

  const draftIds = useMemo(() => {
    return localStorageRepo
      .listKeys('pdp:draft:')
      .map((key) => key.replace('pdp:draft:', ''))
      .filter((id) => scenarios.some((scenario) => scenario.id === id))
  }, [])

  const firstDraftId = draftIds[0]

  return (
    <div className="grid gap-8">
      <section className="rounded-3xl border border-brand-200 bg-brand-50 p-6 sm:p-10">
        <Pill tone="amber" icon={<Sparkles size={14} aria-hidden />}>
          {strings.app.builtFor}
        </Pill>
        <h1 className="mt-4 max-w-3xl font-extrabold tracking-tight">{strings.home.heroTitle}</h1>
        <p className="mt-4 max-w-2xl fs-body leading-relaxed text-ink-700">
          {strings.home.heroLead}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/skenario" className="btn btn-primary btn-lg">
            {strings.home.ctaStart}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>

        {firstDraftId && (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-200 bg-white p-4">
            <p className="fs-body font-semibold text-ink-800">{strings.home.resumeDraft}</p>
            <Link to={`/latihan/${firstDraftId}`} className="btn btn-secondary">
              {strings.home.resumeDraftAction}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="cara-kerja" className="grid gap-4">
        <h2 id="cara-kerja" className="font-extrabold text-ink-900">
          {strings.home.howTitle}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {strings.home.howSteps.map((step, index) => {
            const Icon = STEP_ICONS[index]
            return (
              <li key={step} className="surface flex min-w-0 items-center gap-4 p-6">
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"
                >
                  <Icon size={24} />
                </span>
                <span className="min-w-0 break-words fs-body font-bold text-ink-900">{step}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-3">
        <p className="flex items-start gap-2 fs-body leading-relaxed text-ink-700">
          <ShieldCheck size={20} className="mt-1 shrink-0 text-brand-600" aria-hidden />
          <span className="min-w-0 break-words">{strings.home.privacyLine}</span>
        </p>

        <button
          type="button"
          className="btn btn-ghost justify-start self-start"
          aria-expanded={showPrivacyDetail}
          aria-controls={privacyDetailId}
          onClick={() => setShowPrivacyDetail((value) => !value)}
        >
          {showPrivacyDetail ? strings.common.showLess : strings.common.showMore}
          <ChevronDown
            size={18}
            aria-hidden
            className={
              showPrivacyDetail ? 'rotate-180 transition-transform' : 'transition-transform'
            }
          />
        </button>

        <div id={privacyDetailId} hidden={!showPrivacyDetail} className="surface p-6">
          <p className="fs-body leading-relaxed text-ink-700">{strings.app.privacyNotice}</p>
        </div>

        <p className="fs-body leading-relaxed text-ink-500">{strings.app.fictionalNotice}</p>
      </div>
    </div>
  )
}

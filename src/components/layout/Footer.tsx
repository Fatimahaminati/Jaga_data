import { strings } from '@/content/strings/id'

export function Footer() {
  return (
    <footer className="mt-10 border-t border-ink-200/70 bg-white">
      <div className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-6 fs-small text-ink-600 sm:px-6 md:grid-cols-2 lg:px-8">
        <p>
          <strong className="text-ink-800">{strings.app.name}</strong> — {strings.app.tagline}
        </p>
        <p className="md:text-right">{strings.nav.footerNote}</p>
        <p className="md:col-span-2 text-ink-500">{strings.app.fictionalNotice}</p>
      </div>
    </footer>
  )
}

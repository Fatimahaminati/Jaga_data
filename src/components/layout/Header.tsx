import { BookOpen, History, Home, Library, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { strings } from '@/content/strings/id'
import { cx } from '@/utils/cx'
import { Dialog } from '@/components/ui/Dialog'
import { SettingsForm } from './SettingsForm'

const LINKS = [
  { to: '/', label: strings.nav.home, icon: Home, end: true },
  { to: '/skenario', label: strings.nav.scenarios, icon: Library, end: false },
  { to: '/riwayat', label: strings.nav.history, icon: History, end: false },
  { to: '/panduan', label: strings.nav.guide, icon: BookOpen, end: false },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          aria-label={strings.app.name}
          className="flex items-center gap-2 rounded-xl px-1 py-1 font-extrabold tracking-tight text-brand-700"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ShieldIcon />
          </span>
          <span className="hidden sm:inline">{strings.app.name}</span>
        </NavLink>

        <nav aria-label={strings.nav.mainLabel} className="ml-auto flex items-center gap-1">
          <ul className="flex items-center gap-1">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  aria-label={label}
                  className={({ isActive }) =>
                    cx(
                      'inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 fs-button font-semibold transition-colors',
                      isActive ? 'bg-brand-100 text-brand-800' : 'text-ink-600 hover:bg-ink-100',
                    )
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={strings.settings.open}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 fs-button font-semibold text-ink-600 transition-colors hover:bg-ink-100"
              >
                <Settings size={16} aria-hidden="true" />
                <span className="hidden md:inline">{strings.settings.open}</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Content title={strings.settings.title} description={strings.guide.privacyBody}>
              <SettingsForm />
            </Dialog.Content>
          </Dialog.Root>
        </nav>
      </div>
    </header>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none">
      <path
        d="M12 3l7 2.5v6c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5v-6L12 3z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M12 3l7 2.5v6c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5v-6L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="9.5" y="11" width="5" height="4.5" rx="1.2" fill="currentColor" />
      <path d="M10.6 11v-1.4a1.4 1.4 0 012.8 0V11" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

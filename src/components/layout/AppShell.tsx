import type { ReactNode } from 'react'
import { strings } from '@/content/strings/id'
import { Footer } from './Footer'
import { Header } from './Header'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#konten-utama" className="skip-link">
        {strings.nav.skipToContent}
      </a>
      <Header />
      <main
        id="konten-utama"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}

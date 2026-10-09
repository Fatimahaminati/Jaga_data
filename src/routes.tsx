import { Suspense, lazy, type ComponentType } from 'react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { strings } from '@/content/strings/id'
import NotFoundPage from '@/pages/NotFoundPage'
// Beranda diimpor langsung (bukan lazy) supaya halaman pendaratan terender pada
// paint pertama — footer ikut bergeser saat chunk masuk dan memicu CLS (lihat
// laporan pengujian fungsi, kasus PERF-03).
import HomePageEager from '@/pages/HomePage'

const ScenariosPage = lazy(() => import('@/pages/ScenariosPage'))
const PracticePage = lazy(() => import('@/pages/PracticePage'))
const ResultPage = lazy(() => import('@/pages/ResultPage'))
const HistoryPage = lazy(() => import('@/pages/HistoryPage'))
const GuidePage = lazy(() => import('@/pages/GuidePage'))

/** Kembali ke atas halaman setiap kali rute berubah. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageFallback() {
  return (
    <Card className="p-8 text-center" role="status" aria-live="polite">
      <p className="fs-small font-semibold text-ink-600">{strings.common.loading}</p>
    </Card>
  )
}

function lazyPage(Page: ComponentType) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Page />
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePageEager />} />
        <Route path="/skenario" element={lazyPage(ScenariosPage)} />
        <Route path="/latihan/:scenarioId" element={lazyPage(PracticePage)} />
        <Route path="/hasil/:attemptId" element={lazyPage(ResultPage)} />
        <Route path="/riwayat" element={lazyPage(HistoryPage)} />
        <Route path="/panduan" element={lazyPage(GuidePage)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}

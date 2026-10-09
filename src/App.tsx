import { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppRoutes } from '@/routes'
import { useSettingsStore } from '@/stores/settingsStore'

/** Terapkan preferensi tampilan ke elemen <html> (skala variabel font & kontras tinggi). */
function useDisplayPreferences() {
  const fontScale = useSettingsStore((state) => state.fontScale)
  const highContrast = useSettingsStore((state) => state.highContrast)

  // Skala font hanya mengalikan variabel `--fs-*` di CSS (lihat styles/index.css),
  // ukuran <html> tidak diubah sama sekali.
  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale
  }, [fontScale])

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high')
    } else {
      document.documentElement.removeAttribute('data-contrast')
    }
  }, [highContrast])
}

export default function App() {
  useDisplayPreferences()

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  )
}

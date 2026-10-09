import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { strings } from '@/content/strings/id'
import { useSettingsStore } from '@/stores/settingsStore'
import App from './App'

const routeControl = vi.hoisted(() => ({ crash: false }))

vi.mock('@/routes', () => ({
  AppRoutes: () => {
    if (routeControl.crash) throw new Error('crash-uji')
    return <div>Konten rute uji</div>
  },
}))

beforeEach(() => {
  routeControl.crash = false
  window.localStorage.clear()
  useSettingsStore.setState({
    nickname: '',
    fontScale: 'normal',
    highContrast: false,
    hintsEnabled: true,
  })
  document.documentElement.removeAttribute('data-contrast')
  delete document.documentElement.dataset.fontScale
})

describe('App — preferensi tampilan', () => {
  it('menandai skala font bawaan ke elemen html tanpa mengubah ukuran html', () => {
    render(<App />)

    // Ukuran <html> tidak disentuh — hanya atribut yang mengalikan variabel --fs-*.
    expect(document.documentElement.style.fontSize).toBe('')
    expect(document.documentElement).toHaveAttribute('data-font-scale', 'normal')
    expect(document.documentElement).not.toHaveAttribute('data-contrast')
  })

  it('memperbarui skala font saat pengaturan berubah', () => {
    render(<App />)

    act(() => {
      useSettingsStore.setState({ fontScale: 'xlarge' })
    })
    expect(document.documentElement).toHaveAttribute('data-font-scale', 'xlarge')

    act(() => {
      useSettingsStore.setState({ fontScale: 'large' })
    })
    expect(document.documentElement).toHaveAttribute('data-font-scale', 'large')

    act(() => {
      useSettingsStore.setState({ fontScale: 'normal' })
    })
    expect(document.documentElement).toHaveAttribute('data-font-scale', 'normal')
  })

  it('menerapkan dan melepas mode kontras tinggi', () => {
    render(<App />)

    act(() => {
      useSettingsStore.setState({ highContrast: true })
    })
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high')

    act(() => {
      useSettingsStore.setState({ highContrast: false })
    })
    expect(document.documentElement).not.toHaveAttribute('data-contrast')
  })
})

describe('App — konten rute', () => {
  it('me-render isi rute aplikasi', () => {
    render(<App />)

    expect(screen.getByText('Konten rute uji')).toBeInTheDocument()
  })
})

describe('App — ErrorBoundary', () => {
  it('menampilkan pesan kesalahan yang jelas saat aplikasi crash', () => {
    routeControl.crash = true
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: strings.errors.general }),
    ).toBeInTheDocument()
    expect(screen.getByText('crash-uji')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.common.reset })).toBeInTheDocument()
    expect(screen.queryByText('Konten rute uji')).toBeNull()

    consoleError.mockRestore()
    routeControl.crash = false
  })

  it('preferensi tampilan tetap diterapkan walau konten crash', () => {
    routeControl.crash = true
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<App />)
    act(() => {
      useSettingsStore.setState({ fontScale: 'xlarge', highContrast: true })
    })

    expect(document.documentElement).toHaveAttribute('data-font-scale', 'xlarge')
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high')

    consoleError.mockRestore()
    routeControl.crash = false
  })
})

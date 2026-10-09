import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

const originalMatchMedia = window.matchMedia as unknown

interface FakeMediaControl {
  setMatches: (next: boolean) => void
  listenerCount: () => number
}

/** Pasang matchMedia tiruan yang bisa dikendalikan test. */
function stubMatchMedia(initialMatches: boolean): FakeMediaControl {
  const state = {
    matches: initialMatches,
    listeners: [] as Array<(event: MediaQueryListEvent) => void>,
  }

  const media = {
    get matches() {
      return state.matches
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      state.listeners.push(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      state.listeners = state.listeners.filter((item) => item !== listener)
    },
    addListener: () => {
      /* mode lama tidak dipakai hook */
    },
    removeListener: () => {
      /* mode lama tidak dipakai hook */
    },
    dispatchEvent: () => true,
  }

  window.matchMedia = (() => media as unknown as MediaQueryList) as typeof window.matchMedia

  return {
    setMatches: (next: boolean) => {
      state.matches = next
      state.listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent))
    },
    listenerCount: () => state.listeners.length,
  }
}

afterEach(() => {
  window.matchMedia = originalMatchMedia as typeof window.matchMedia
  vi.unstubAllGlobals()
})

describe('useReducedMotion', () => {
  it('mengembalikan true bila sistem meminta kurangi gerak', () => {
    stubMatchMedia(true)

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)
  })

  it('mengembalikan false bila sistem tidak meminta kurangi gerak', () => {
    stubMatchMedia(false)

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)
  })

  it('mendengarkan perubahan preferensi gerak', () => {
    const media = stubMatchMedia(false)

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    expect(media.listenerCount()).toBe(1)

    act(() => {
      media.setMatches(true)
    })

    expect(result.current).toBe(true)
  })

  it('berhenti mendengarkan setelah komponen dilepas', () => {
    const media = stubMatchMedia(false)

    const { unmount } = renderHook(() => useReducedMotion())
    expect(media.listenerCount()).toBe(1)

    unmount()

    expect(media.listenerCount()).toBe(0)
  })

  it('aman bila matchMedia tidak tersedia (false)', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)
  })
})

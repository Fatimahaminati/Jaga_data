import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function readQuery(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(QUERY).matches
}

/** Menghormati preferensi sistem: matikan animasi bila diminta. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readQuery)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia(QUERY)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    media.addEventListener('change', onChange)
    setReduced(media.matches)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Decision } from '@/domain/types'
import { localStorageRepo } from '@/infra/storage/localStorageRepo'
import { KEYS } from '@/infra/storage/StorageRepository'
import { clearDraft, draftKey, loadDraft, useAutosaveDraft } from './useAutosaveDraft'

const SCENARIO_ID = 'perkenalan-diri'
const DEBOUNCE_MS = 400

const decisions: Decision[] = [{ segmentId: 's1-01', action: 'remove' }]
const otherDecisions: Decision[] = [
  { segmentId: 's1-01', action: 'remove' },
  { segmentId: 's1-02', action: 'generalize', optionId: 's1-02-o1' },
]

function validDraft(scenarioId = SCENARIO_ID) {
  return {
    scenarioId,
    decisions,
    hintUsed: false,
    updatedAt: new Date().toISOString(),
  }
}

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutosaveDraft', () => {
  it('menulis draf ke localStorage setelah jeda debounce', () => {
    renderHook(() => useAutosaveDraft(SCENARIO_ID, decisions, false))

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 1)
    })
    expect(loadDraft(SCENARIO_ID)).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    const draft = loadDraft(SCENARIO_ID)
    expect(draft).not.toBeNull()
    expect(draft?.scenarioId).toBe(SCENARIO_ID)
    expect(draft?.decisions).toEqual(decisions)
    expect(draft?.hintUsed).toBe(false)
    expect(draft?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('menyimpan bendera mode petunjuk dalam draf', () => {
    renderHook(() => useAutosaveDraft(SCENARIO_ID, decisions, true))

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS)
    })

    expect(loadDraft(SCENARIO_ID)?.hintUsed).toBe(true)
  })

  it('menghapus draf lama saat keputusan dikosongkan', () => {
    expect(localStorageRepo.write(draftKey(SCENARIO_ID), validDraft())).toBe(true)

    renderHook(() => useAutosaveDraft(SCENARIO_ID, [], false))
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS)
    })

    expect(loadDraft(SCENARIO_ID)).toBeNull()
  })

  it('tidak menulis apa pun bila skenario masih null', () => {
    renderHook(() => useAutosaveDraft(null, decisions, false))

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS * 5)
    })

    expect(window.localStorage.length).toBe(0)
  })

  it('membatalkan penulisan bila komponen dilepas sebelum debounce selesai', () => {
    const { unmount } = renderHook(() => useAutosaveDraft(SCENARIO_ID, decisions, false))

    unmount()
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS * 5)
    })

    expect(loadDraft(SCENARIO_ID)).toBeNull()
  })

  it('menunda timer setiap kali keputusan berubah (debounce)', () => {
    const { rerender } = renderHook(
      ({ value }: { value: Decision[] }) => useAutosaveDraft(SCENARIO_ID, value, false),
      { initialProps: { value: decisions } },
    )

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 100)
    })
    rerender({ value: otherDecisions })
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 100)
    })

    // Total waktu sudah > debounce, tetapi timer dimulai ulang saat perubahan terakhir.
    expect(loadDraft(SCENARIO_ID)).toBeNull()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(loadDraft(SCENARIO_ID)?.decisions).toEqual(otherDecisions)
  })
})

describe('helper draf', () => {
  it('draftKey memakai prefiks pdp:draft:', () => {
    expect(draftKey('skenario-a')).toBe(KEYS.draft('skenario-a'))
    expect(draftKey('skenario-a')).toBe('pdp:draft:skenario-a')
  })

  it('loadDraft membaca draf yang valid', () => {
    localStorageRepo.write(draftKey(SCENARIO_ID), validDraft())

    expect(loadDraft(SCENARIO_ID)?.decisions).toEqual(decisions)
  })

  it('loadDraft mengembalikan null untuk data rusak', () => {
    window.localStorage.setItem(draftKey(SCENARIO_ID), '{tidak-valid')

    expect(loadDraft(SCENARIO_ID)).toBeNull()
  })

  it('clearDraft menghapus draf tersimpan', () => {
    localStorageRepo.write(draftKey(SCENARIO_ID), validDraft())

    clearDraft(SCENARIO_ID)

    expect(loadDraft(SCENARIO_ID)).toBeNull()
    expect(window.localStorage.getItem(draftKey(SCENARIO_ID))).toBeNull()
  })
})

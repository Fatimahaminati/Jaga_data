import { beforeEach, describe, expect, it } from 'vitest'
import { scenarios, getScenario } from '@/content/scenarios'
import { score } from '@/domain/scoring/engine'
import type { Decision } from '@/domain/types'
import { findDecision, useSessionStore } from './sessionStore'

const scenario = getScenario('perkenalan-diri')
if (!scenario) throw new Error('skenario uji tidak ditemukan')

const INITIAL = {
  scenarioId: null,
  decisions: [] as Decision[],
  past: [] as Decision[][],
  future: [] as Decision[][],
  hintUsed: false,
  startedAt: null,
  result: null,
  durationMs: 0,
}

beforeEach(() => {
  useSessionStore.setState(INITIAL)
})

describe('startScenario & reset', () => {
  it('memulai skenario dengan nilai bawaan', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')

    const state = useSessionStore.getState()
    expect(state.scenarioId).toBe('perkenalan-diri')
    expect(state.decisions).toEqual([])
    expect(state.past).toEqual([])
    expect(state.future).toEqual([])
    expect(state.hintUsed).toBe(false)
    expect(state.startedAt).not.toBeNull()
    expect(state.result).toBeNull()
    expect(state.durationMs).toBe(0)
  })

  it('menerima opsi awal (keputusan, petunjuk, waktu mulai)', () => {
    const decisions: Decision[] = [{ segmentId: 's1-01', action: 'keep' }]
    useSessionStore.getState().startScenario('perkenalan-diri', {
      decisions,
      hintUsed: true,
      startedAt: 1_000,
    })

    const state = useSessionStore.getState()
    expect(state.decisions).toEqual(decisions)
    expect(state.hintUsed).toBe(true)
    expect(state.startedAt).toBe(1_000)
  })

  it('reset mengosongkan keputusan & hasil tanpa menghapus skenario aktif', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'remove' })
    useSessionStore.getState().submit(scenario)

    useSessionStore.getState().reset()

    const state = useSessionStore.getState()
    expect(state.scenarioId).toBe('perkenalan-diri')
    expect(state.startedAt).not.toBeNull()
    expect(state.decisions).toEqual([])
    expect(state.past).toEqual([])
    expect(state.future).toEqual([])
    expect(state.result).toBeNull()
  })

  it('clear mengembalikan seluruh state ke keadaan awal', () => {
    useSessionStore.getState().startScenario('perkenalan-diri', { hintUsed: true })
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'remove' })

    useSessionStore.getState().clear()

    expect(useSessionStore.getState()).toMatchObject(INITIAL)
  })
})

describe('keputusan', () => {
  it('menambah keputusan baru beserta riwayat undo', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })

    const state = useSessionStore.getState()
    expect(state.decisions).toHaveLength(1)
    expect(state.past).toHaveLength(1)
    expect(state.past[0]).toEqual([])
    expect(state.future).toEqual([])
  })

  it('menambahkan keputusan untuk tiap segmen sesuai urutan', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().setDecision({ segmentId: 's1-02', action: 'remove' })

    expect(useSessionStore.getState().decisions.map((item) => item.segmentId)).toEqual([
      's1-01',
      's1-02',
    ])
  })

  it('mengganti keputusan segmen yang sama tanpa menduplikasi', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'remove' })

    const state = useSessionStore.getState()
    expect(state.decisions).toHaveLength(1)
    expect(state.decisions[0].action).toBe('remove')
    expect(state.past).toHaveLength(2)
  })

  it('abaikan bila keputusan identik (tidak menambah riwayat)', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })

    const state = useSessionStore.getState()
    expect(state.decisions).toHaveLength(1)
    expect(state.past).toHaveLength(1)
  })

  it('clearDecision menghapus segmen tertentu beserta riwayatnya', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().setDecision({ segmentId: 's1-02', action: 'remove' })

    useSessionStore.getState().clearDecision('s1-01')

    expect(useSessionStore.getState().decisions.map((item) => item.segmentId)).toEqual(['s1-02'])
  })

  it('clearDecision untuk segmen yang tidak ada tidak mengubah keadaan', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')

    useSessionStore.getState().clearDecision('tidak-ada')

    const state = useSessionStore.getState()
    expect(state.decisions).toEqual([])
    expect(state.past).toEqual([])
  })
})

describe('undo / redo', () => {
  it('undo mengembalikan keputusan sebelumnya dan redo menerapkannya lagi', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().setDecision({ segmentId: 's1-02', action: 'remove' })

    useSessionStore.getState().undo()
    expect(useSessionStore.getState().decisions.map((item) => item.segmentId)).toEqual(['s1-01'])
    expect(useSessionStore.getState().future).toHaveLength(1)

    useSessionStore.getState().redo()
    expect(useSessionStore.getState().decisions.map((item) => item.segmentId)).toEqual([
      's1-01',
      's1-02',
    ])
    expect(useSessionStore.getState().future).toEqual([])
  })

  it('undo tanpa riwayat tidak mengubah apa pun', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')

    useSessionStore.getState().undo()

    const state = useSessionStore.getState()
    expect(state.decisions).toEqual([])
    expect(state.past).toEqual([])
    expect(state.future).toEqual([])
  })

  it('redo tanpa riwayat masa depan tidak mengubah apa pun', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')

    useSessionStore.getState().redo()

    expect(useSessionStore.getState().decisions).toEqual([])
  })

  it('keputusan baru setelah undo membuang riwayat redo', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().setDecision({ segmentId: 's1-01', action: 'keep' })
    useSessionStore.getState().undo()

    useSessionStore.getState().setDecision({ segmentId: 's1-02', action: 'remove' })

    expect(useSessionStore.getState().future).toEqual([])
    expect(useSessionStore.getState().decisions.map((item) => item.segmentId)).toEqual(['s1-02'])
  })

  it('riwayat undo dan redo dibatasi agar tidak tumbuh tanpa batas', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    for (let index = 0; index < 150; index += 1) {
      useSessionStore.getState().setDecision({ segmentId: `s1-${index}`, action: 'keep' })
    }

    expect(useSessionStore.getState().past.length).toBeLessThanOrEqual(101)
    expect(useSessionStore.getState().past.length).toBeGreaterThan(100)
  })
})

describe('petunjuk', () => {
  it('toggleHint menyalakan dan mematikan mode petunjuk', () => {
    useSessionStore.getState().toggleHint()
    expect(useSessionStore.getState().hintUsed).toBe(true)

    useSessionStore.getState().toggleHint()
    expect(useSessionStore.getState().hintUsed).toBe(false)
  })
})

describe('submit', () => {
  it('menghitung skor dari keputusan dan menyimpannya di state', () => {
    useSessionStore.getState().startScenario('perkenalan-diri', { startedAt: Date.now() - 2_000 })
    useSessionStore.getState().setDecision({ segmentId: 's1-03', action: 'remove' })

    const result = useSessionStore.getState().submit(scenario)

    expect(result).toEqual(score(scenario, [{ segmentId: 's1-03', action: 'remove' }]))
    expect(useSessionStore.getState().result).toEqual(result)
    expect(useSessionStore.getState().durationMs).toBeGreaterThanOrEqual(2_000)
  })

  it('memberi penalti petunjuk bila mode hint dipakai', () => {
    useSessionStore.getState().startScenario('perkenalan-diri')
    const tanpaHint = useSessionStore.getState().submit(scenario)

    useSessionStore.getState().reset()
    useSessionStore.getState().startScenario('perkenalan-diri')
    useSessionStore.getState().toggleHint()
    const denganHint = useSessionStore.getState().submit(scenario)

    expect(denganHint.total).toBeLessThan(tanpaHint.total)
  })

  it('durasi tidak negatif walau waktu mulai di masa depan', () => {
    useSessionStore.getState().startScenario('perkenalan-diri', {
      startedAt: Date.now() + 60_000,
    })

    useSessionStore.getState().submit(scenario)

    expect(useSessionStore.getState().durationMs).toBe(0)
  })
})

describe('findDecision', () => {
  it('menemukan keputusan berdasar segmen', () => {
    const decisions: Decision[] = [
      { segmentId: 's1-01', action: 'keep' },
      { segmentId: 's1-02', action: 'remove' },
    ]

    expect(findDecision(decisions, 's1-02')?.action).toBe('remove')
    expect(findDecision(decisions, 's1-99')).toBeUndefined()
  })
})

describe('daftar skenario konten', () => {
  it('menyediakan tepat tiga skenario untuk diuji', () => {
    expect(scenarios).toHaveLength(3)
    expect(scenarios.map((item) => item.id)).toEqual([
      'perkenalan-diri',
      'tugas-dan-curhat',
      'formulir-dan-percakapan',
    ])
  })
})

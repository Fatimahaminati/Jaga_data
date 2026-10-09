import { create } from 'zustand'
import { score } from '@/domain/scoring/engine'
import type { Decision, ScoreResult, Scenario } from '@/domain/types'

const HISTORY_LIMIT = 100

export interface SessionState {
  scenarioId: string | null
  /** Daftar keputusan immutable (urutan = urutan segmen). */
  decisions: Decision[]
  past: Decision[][]
  future: Decision[][]
  hintUsed: boolean
  startedAt: number | null
  result: ScoreResult | null
  durationMs: number

  startScenario: (
    scenarioId: string,
    options?: { decisions?: Decision[]; hintUsed?: boolean; startedAt?: number },
  ) => void
  setDecision: (decision: Decision) => void
  clearDecision: (segmentId: string) => void
  undo: () => void
  redo: () => void
  reset: () => void
  toggleHint: () => void
  submit: (scenario: Scenario) => ScoreResult
  clear: () => void
}

function withHistory(
  state: SessionState,
  next: Decision[],
): Pick<SessionState, 'decisions' | 'past' | 'future'> {
  return {
    decisions: next,
    past: [...state.past.slice(-HISTORY_LIMIT), state.decisions],
    future: [],
  }
}

export function findDecision(decisions: Decision[], segmentId: string): Decision | undefined {
  return decisions.find((decision) => decision.segmentId === segmentId)
}

export const useSessionStore = create<SessionState>((set, get) => ({
  scenarioId: null,
  decisions: [],
  past: [],
  future: [],
  hintUsed: false,
  startedAt: null,
  result: null,
  durationMs: 0,

  startScenario: (scenarioId, options = {}) => {
    set({
      scenarioId,
      decisions: options.decisions ?? [],
      past: [],
      future: [],
      hintUsed: options.hintUsed ?? false,
      startedAt: options.startedAt ?? Date.now(),
      result: null,
      durationMs: 0,
    })
  },

  setDecision: (decision) => {
    const state = get()
    const existing = findDecision(state.decisions, decision.segmentId)
    if (
      existing &&
      existing.action === decision.action &&
      existing.optionId === decision.optionId
    ) {
      return
    }
    const next = existing
      ? state.decisions.map((item) => (item.segmentId === decision.segmentId ? decision : item))
      : [...state.decisions, decision]
    set(withHistory(state, next))
  },

  clearDecision: (segmentId) => {
    const state = get()
    if (!state.decisions.some((decision) => decision.segmentId === segmentId)) return
    set(
      withHistory(
        state,
        state.decisions.filter((d) => d.segmentId !== segmentId),
      ),
    )
  },

  undo: () => {
    const state = get()
    const previous = state.past[state.past.length - 1]
    if (!previous) return
    set({
      decisions: previous,
      past: state.past.slice(0, -1),
      future: [state.decisions, ...state.future].slice(0, HISTORY_LIMIT),
    })
  },

  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return
    set({
      decisions: next,
      past: [...state.past.slice(-HISTORY_LIMIT), state.decisions],
      future: state.future.slice(1),
    })
  },

  reset: () => {
    set({ decisions: [], past: [], future: [], result: null })
  },

  toggleHint: () => set((state) => ({ hintUsed: !state.hintUsed })),

  submit: (scenario) => {
    const state = get()
    const startedAt = state.startedAt ?? Date.now()
    const result = score(scenario, state.decisions, { hintUsed: state.hintUsed })
    set({ result, durationMs: Math.max(0, Date.now() - startedAt) })
    return result
  },

  clear: () =>
    set({
      scenarioId: null,
      decisions: [],
      past: [],
      future: [],
      hintUsed: false,
      startedAt: null,
      result: null,
      durationMs: 0,
    }),
}))

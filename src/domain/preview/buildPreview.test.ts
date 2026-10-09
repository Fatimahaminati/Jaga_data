import { describe, expect, it } from 'vitest'
import type { Decision, Scenario } from '../types'
import { buildPreview } from './buildPreview'

const scenario: Scenario = {
  id: 'uji',
  title: 'Skenario uji',
  difficulty: 1,
  context: 'konteks',
  aiTaskGoal: 'tujuan',
  learningObjectives: ['o'],
  segments: [
    {
      id: 'a',
      text: 'Halo, boleh kenalan?',
      options: [
        { id: 'a1', label: 'salam pembuka', quality: 'good' },
        { id: 'a2', label: 'halo', quality: 'acceptable' },
        { id: 'a3', label: 'halo, namaku Raka', quality: 'poor' },
      ],
    },
    {
      id: 'b',
      text: 'Namaku Raka Aditya.',
      options: [
        { id: 'b1', label: 'Raka', quality: 'good' },
        { id: 'b2', label: '[namaku]', quality: 'acceptable' },
        { id: 'b3', label: 'Raka Aditya', quality: 'poor' },
      ],
      sensitive: {
        category: 'nama',
        level: 'medium',
        rule: { best: ['generalize'], acceptable: ['remove'] },
        feedback: { correct: 'c', partial: 'p', wrong: 'w', tip: 't' },
      },
    },
    {
      id: 'c',
      text: 'Aku ingin berlatih bahasa Inggris.',
      options: [
        { id: 'c1', label: 'berlatih bahasa Inggris', quality: 'good' },
        { id: 'c2', label: 'belajar bahasa', quality: 'acceptable' },
        { id: 'c3', label: 'belajar di SMP Negeri 3 Semarang', quality: 'poor' },
      ],
    },
  ],
}

const d = (segmentId: string, action: Decision['action'], optionId?: string): Decision => ({
  segmentId,
  action,
  optionId,
})

describe('buildPreview', () => {
  it('tanpa keputusan, sebelum dan sesudah identik', () => {
    const preview = buildPreview(scenario, [])

    expect(preview.before).toBe(
      'Halo, boleh kenalan? Namaku Raka Aditya. Aku ingin berlatih bahasa Inggris.',
    )
    expect(preview.after).toBe(preview.before)
    expect(preview.parts.every((part) => part.kind === 'unchanged')).toBe(true)
  })

  it('segmen yang dihapus keluar dari teks sesudah', () => {
    const preview = buildPreview(scenario, [d('b', 'remove')])
    const part = preview.parts.find((item) => item.segmentId === 'b')

    expect(part?.kind).toBe('removed')
    expect(part?.text).toBe('')
    expect(preview.after).toBe('Halo, boleh kenalan? Aku ingin berlatih bahasa Inggris.')
    expect(preview.before).toContain('Namaku Raka Aditya.')
  })

  it('generalisasi diganti dengan label opsi terpilih', () => {
    const preview = buildPreview(scenario, [d('b', 'generalize', 'b1')])
    const part = preview.parts.find((item) => item.segmentId === 'b')

    expect(part?.kind).toBe('generalized')
    expect(part?.text).toBe('Raka')
    expect(preview.after).toBe('Halo, boleh kenalan? Raka Aku ingin berlatih bahasa Inggris.')
  })

  it('pertahankan ditandai tetapi teks tidak berubah', () => {
    const preview = buildPreview(scenario, [d('b', 'keep')])
    const part = preview.parts.find((item) => item.segmentId === 'b')

    expect(part?.kind).toBe('kept')
    expect(part?.text).toBe('Namaku Raka Aditya.')
    expect(preview.after).toBe(preview.before)
  })

  it('keputusan untuk segmen asing diabaikan', () => {
    const preview = buildPreview(scenario, [d('tidak-ada', 'remove')])
    expect(preview.parts).toHaveLength(scenario.segments.length)
    expect(preview.after).toBe(preview.before)
  })

  it('deterministik', () => {
    const decisions = [d('b', 'generalize', 'b2'), d('c', 'remove')]
    expect(buildPreview(scenario, decisions)).toEqual(buildPreview(scenario, decisions))
  })
})

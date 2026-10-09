import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { score } from '@/domain/scoring/engine'
import type { Decision, ScoreResult } from '@/domain/types'
import { SegmentFeedbackList, TopFeedbackList } from './SegmentFeedbackList'

const scenario = scenarios[0]
const [salutation, nameSegment, addressSegment] = scenario.segments

/** Opsi generalisasi berkualitas baik — dipilih eksplisit agar verdict tetap "tepat". */
const goodOption = nameSegment.options.find((option) => option.quality === 'good')

const decisions: Decision[] = [
  { segmentId: salutation.id, action: 'keep' },
  { segmentId: nameSegment.id, action: 'generalize', optionId: goodOption?.id },
  { segmentId: addressSegment.id, action: 'keep' },
  { segmentId: scenario.segments[6].id, action: 'remove' },
]

const result = score(scenario, decisions)

function renderList() {
  return render(<SegmentFeedbackList scenario={scenario} decisions={decisions} result={result} />)
}

function itemIndexFor(segmentId: string): number {
  return result.perSegment.findIndex((item) => item.segmentId === segmentId)
}

describe('SegmentFeedbackList', () => {
  it('menampilkan satu kartu umpan balik untuk tiap segmen yang dinilai', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(result.perSegment.length)

    result.perSegment.forEach((segmentScore, index) => {
      const segment = scenario.segments.find((item) => item.id === segmentScore.segmentId)
      expect(within(items[index]).getByText(`“${segment?.text}”`)).toBeInTheDocument()
    })
  })

  it('menampilkan verdict tepat, cukup baik, dan keliru sesuai hasil', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    result.perSegment.forEach((segmentScore, index) => {
      expect(
        within(items[index]).getByText(strings.verdict[segmentScore.verdict]),
      ).toBeInTheDocument()
    })
    expect(screen.getAllByText(strings.verdict.correct).length).toBeGreaterThan(0)
    expect(screen.getAllByText(strings.verdict.wrong).length).toBeGreaterThan(0)
  })

  it('menampilkan label aksi keputusan siswa', () => {
    renderList()

    expect(screen.getAllByText(strings.action.keep).length).toBeGreaterThan(0)
    expect(screen.getAllByText(strings.action.remove).length).toBeGreaterThan(0)
    expect(screen.getAllByText(strings.action.generalize).length).toBeGreaterThan(0)
    expect(screen.getAllByText(strings.practice.untouched).length).toBeGreaterThan(0)
  })

  it('menampilkan kategori, tingkat risiko, dan tips segmen sensitif', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    const index = itemIndexFor(nameSegment.id)
    expect(nameSegment.sensitive).toBeDefined()

    expect(within(items[index]).getByText(strings.feedback.category.nama)).toBeInTheDocument()
    expect(
      within(items[index]).getByText(new RegExp(strings.feedback.levelLabel)),
    ).toHaveTextContent(strings.feedback.level.medium)
    // Segmen ini dijawab tepat, jadi tips tidak ditampilkan.
    expect(
      within(items[index]).queryByText(new RegExp(strings.feedback.tipLabel)),
    ).not.toBeInTheDocument()
  })

  it('tips muncul untuk segmen sensitif yang keliru', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    const index = itemIndexFor(addressSegment.id)
    expect(result.perSegment[index].verdict).toBe('wrong')

    const tip = addressSegment.sensitive?.feedback.tip ?? ''
    expect(
      within(items[index]).getByText(new RegExp(strings.feedback.tipLabel)),
    ).toBeInTheDocument()
    expect(within(items[index]).getByText(tip)).toBeInTheDocument()
    expect(within(items[index]).getByText(strings.feedback.category.alamat)).toBeInTheDocument()
    expect(
      within(items[index]).getByText(new RegExp(strings.feedback.levelLabel)),
    ).toHaveTextContent(strings.feedback.level.high)
  })

  it('segmen non-sensitif memakai umpan balik netral dan label aman', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    const index = itemIndexFor(scenario.segments[7].id)
    const segmentScore = result.perSegment[index]

    expect(within(items[index]).getByText(strings.feedback.safeLabel)).toBeInTheDocument()
    expect(
      within(items[index]).getByText(strings.result.neutralFeedback[segmentScore.verdict]),
    ).toBeInTheDocument()
  })

  it('menampilkan hasil generalisasi yang dipilih siswa', () => {
    renderList()

    const items = screen.getAllByRole('listitem')
    const index = itemIndexFor(nameSegment.id)

    expect(within(items[index]).getByText(goodOption?.label ?? '')).toBeInTheDocument()
    expect(within(items[index]).getByText(new RegExp(strings.preview.after))).toBeInTheDocument()
  })

  it('menampilkan ikon info untuk verdict yang hanya sebagian', () => {
    const target = scenario.segments[7]
    const goodTargetOption = target.options.find((option) => option.quality === 'good')
    const partialDecisions: Decision[] = [
      { segmentId: target.id, action: 'generalize', optionId: goodTargetOption?.id },
    ]
    const partialResult = score(scenario, partialDecisions)
    render(
      <SegmentFeedbackList
        scenario={scenario}
        decisions={partialDecisions}
        result={partialResult}
      />,
    )

    expect(partialResult.perSegment.some((item) => item.verdict === 'partial')).toBe(true)
    expect(screen.getAllByText(strings.verdict.partial).length).toBeGreaterThan(0)
  })

  it('melewatkan segmen yang tidak dikenali tanpa crash', () => {
    const fakeResult: ScoreResult = {
      total: 50,
      privacyScore: 50,
      utilityScore: 50,
      badge: 'waspada',
      perSegment: [
        {
          segmentId: salutation.id,
          verdict: 'correct',
          points: 1,
          feedback: '',
          sensitive: false,
          level: 'safe',
        },
        {
          segmentId: 'tidak-ada',
          verdict: 'wrong',
          points: 0,
          feedback: 'diabaikan',
          sensitive: true,
          level: 'high',
        },
      ],
    }

    render(<SegmentFeedbackList scenario={scenario} decisions={[]} result={fakeResult} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('diabaikan')).not.toBeInTheDocument()
  })
})

describe('TopFeedbackList', () => {
  it('menampilkan paling banyak 3 hal terburuk', () => {
    const result = score(scenario, [])
    render(<TopFeedbackList scenario={scenario} result={result} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    items.forEach((item) => {
      expect(within(item).getByText(strings.verdict.wrong)).toBeInTheDocument()
    })
  })

  it('mengurutkan keliru sebelum cukup baik dan mengabaikan yang tepat', () => {
    const base = score(scenario, [])
    const mixed: ScoreResult = {
      ...base,
      perSegment: [
        {
          segmentId: 's1-01',
          verdict: 'partial',
          points: 1,
          feedback: '',
          sensitive: false,
          level: 'safe',
        },
        {
          segmentId: 's1-02',
          verdict: 'correct',
          points: 2,
          feedback: '',
          sensitive: false,
          level: 'safe',
        },
        {
          segmentId: 's1-03',
          verdict: 'wrong',
          points: 0,
          feedback: 'Umpan balik keliru.',
          sensitive: true,
          level: 'high',
        },
        {
          segmentId: 's1-04',
          verdict: 'partial',
          points: 1,
          feedback: '',
          sensitive: false,
          level: 'safe',
        },
      ],
    }
    render(<TopFeedbackList scenario={scenario} result={mixed} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)

    expect(within(items[0]).getByText(strings.verdict.wrong)).toBeInTheDocument()
    expect(within(items[0]).getByText('Umpan balik keliru.')).toBeInTheDocument()
    expect(
      within(items[0]).getByText(
        '“Aku tinggal di Jl. Kenanga No. 12, Kelurahan Sukamaju, Kota Semarang.”',
      ),
    ).toBeInTheDocument()

    // Segmen tanpa umpan balik memakai teks netral bawaan kamus.
    expect(within(items[1]).getByText(strings.verdict.partial)).toBeInTheDocument()
    expect(within(items[1]).getByText(strings.result.neutralFeedback.partial)).toBeInTheDocument()
    expect(within(items[2]).getByText(strings.verdict.partial)).toBeInTheDocument()
  })

  it('menampilkan pesan bila semua segmen dijawab tepat', () => {
    const base = score(scenario, [])
    const allCorrect: ScoreResult = {
      ...base,
      perSegment: base.perSegment.map((item) => ({ ...item, verdict: 'correct' as const })),
    }
    render(<TopFeedbackList scenario={scenario} result={allCorrect} />)

    expect(screen.getByText(strings.result.topEmpty)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('tetap merender catatan walau segmen tidak dikenali', () => {
    const fakeResult: ScoreResult = {
      total: 50,
      privacyScore: 50,
      utilityScore: 50,
      badge: 'waspada',
      perSegment: [
        {
          segmentId: 'tidak-ada',
          verdict: 'wrong',
          points: 0,
          feedback: '',
          sensitive: false,
          level: 'safe',
        },
      ],
    }
    render(<TopFeedbackList scenario={scenario} result={fakeResult} />)

    const [item] = screen.getAllByRole('listitem')
    expect(within(item).getByText(strings.result.neutralFeedback.wrong)).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { scenarios } from '@/content/scenarios'
import { strings } from '@/content/strings/id'
import { formatScore } from '@/utils/date'
import { ScenarioList } from './ScenarioList'

describe('ScenarioList', () => {
  it('merender satu kartu untuk setiap skenario', () => {
    render(
      <MemoryRouter>
        <ScenarioList
          scenarios={scenarios}
          bestByScenario={{}}
          attemptsByScenario={{}}
          draftScenarioIds={[]}
        />
      </MemoryRouter>,
    )

    const list = screen.getByRole('list')
    expect(list.querySelectorAll(':scope > li')).toHaveLength(scenarios.length)
    scenarios.forEach((scenario) => {
      expect(screen.getByRole('heading', { name: scenario.title })).toBeInTheDocument()
    })
    expect(screen.getAllByText(strings.scenarios.notAttempted)).toHaveLength(scenarios.length)
  })

  it('meneruskan skor terbaik, jumlah percobaan, dan penanda draf', () => {
    render(
      <MemoryRouter>
        <ScenarioList
          scenarios={scenarios}
          bestByScenario={{ [scenarios[0].id]: 90 }}
          attemptsByScenario={{ [scenarios[0].id]: 3, [scenarios[1].id]: 1 }}
          draftScenarioIds={[scenarios[1].id]}
        />
      </MemoryRouter>,
    )

    const firstCard = screen
      .getByRole('heading', { name: scenarios[0].title })
      .closest('li') as HTMLElement
    expect(within(firstCard).getByText(new RegExp(strings.scenarios.bestScore))).toBeInTheDocument()
    expect(firstCard).toHaveTextContent(formatScore(90))
    expect(firstCard).toHaveTextContent(`3 ${strings.scenarios.attempts}`)
    expect(within(firstCard).getByRole('link', { name: new RegExp(strings.scenarios.continue) }))

    const secondCard = screen
      .getByRole('heading', { name: scenarios[1].title })
      .closest('li') as HTMLElement
    expect(within(secondCard).getByText(strings.home.resumeDraft)).toBeInTheDocument()
    expect(within(secondCard).getByText(strings.scenarios.notAttempted)).toBeInTheDocument()
  })

  it('menampilkan daftar kosong bila tidak ada skenario', () => {
    const { container } = render(
      <MemoryRouter>
        <ScenarioList
          scenarios={[]}
          bestByScenario={{}}
          attemptsByScenario={{}}
          draftScenarioIds={[]}
        />
      </MemoryRouter>,
    )

    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

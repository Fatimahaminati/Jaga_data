import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { strings } from '@/content/strings/id'
import type { Attempt } from '@/domain/types'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { SettingsForm } from './SettingsForm'

function sampleAttempt(id: string): Attempt {
  return {
    id,
    scenarioId: 'perkenalan-diri',
    decisions: [],
    result: {
      total: 70,
      privacyScore: 80,
      utilityScore: 60,
      perSegment: [],
      badge: 'waspada',
    },
    createdAt: '2026-01-10T08:00:00.000Z',
    durationMs: 60_000,
    hintUsed: false,
  }
}

const nicknameLabel = `${strings.guide.nicknameLabel} (${strings.common.optional})`

describe('SettingsForm', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      nickname: '',
      fontScale: 'normal',
      highContrast: false,
      hintsEnabled: true,
    })
    useProgressStore.setState({ attempts: [] })
  })

  it('tidak menampilkan peringatan bila penyimpanan lokal tersedia', () => {
    // Penyimpanan jsdom tersedia, jadi peringatan tidak muncul.
    render(<SettingsForm />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByLabelText(nicknameLabel)).toBeInTheDocument()
  })

  it('mengubah nickname di store saat diketik', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)

    const input = screen.getByLabelText(nicknameLabel)
    await user.type(input, 'Budi')

    expect(useSettingsStore.getState().nickname).toBe('Budi')
    expect(input).toHaveValue('Budi')
  })

  it('membatasi nickname maksimal 24 karakter', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)

    const input = screen.getByLabelText(nicknameLabel)
    expect(input).toHaveAttribute('maxlength', '24')

    await user.type(input, 'abcdefghijklmnopqrstuvwxyz')
    expect(useSettingsStore.getState().nickname).toBe('abcdefghijklmnopqrstuvwx')
  })

  it('mengubah ukuran teks lewat radio', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)

    await user.click(screen.getByLabelText(strings.guide.fontScale.xlarge))
    expect(useSettingsStore.getState().fontScale).toBe('xlarge')

    await user.click(screen.getByLabelText(strings.guide.fontScale.large))
    expect(useSettingsStore.getState().fontScale).toBe('large')
    expect(screen.getByLabelText(strings.guide.fontScale.large)).toBeChecked()
    expect(screen.getByLabelText(strings.guide.fontScale.xlarge)).not.toBeChecked()
  })

  it('mengalihkan mode kontras tinggi', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)

    const toggle = screen.getByLabelText(strings.guide.highContrastLabel)
    expect(toggle).not.toBeChecked()

    await user.click(toggle)
    expect(useSettingsStore.getState().highContrast).toBe(true)

    await user.click(toggle)
    expect(useSettingsStore.getState().highContrast).toBe(false)
  })

  it('mengalihkan izin mode petunjuk', async () => {
    const user = userEvent.setup()
    render(<SettingsForm />)

    const toggle = screen.getByLabelText(strings.guide.hintsLabel)
    expect(toggle).toBeChecked()

    await user.click(toggle)
    expect(useSettingsStore.getState().hintsEnabled).toBe(false)

    await user.click(toggle)
    expect(useSettingsStore.getState().hintsEnabled).toBe(true)
  })

  it('reset data lokal membutuhkan konfirmasi dua langkah', async () => {
    const user = userEvent.setup()
    useSettingsStore.setState({ nickname: 'Budi', highContrast: true })
    useProgressStore.setState({ attempts: [sampleAttempt('a-1')] })
    render(<SettingsForm />)

    const resetButton = screen.getByRole('button', { name: strings.guide.clearLocalData })
    await user.click(resetButton)

    // Langkah pertama: hanya meminta konfirmasi, data belum dihapus.
    expect(screen.getByRole('status')).toHaveTextContent(
      `${strings.guide.clearLocalDataBody} — ${strings.common.confirm}`,
    )
    expect(useSettingsStore.getState().nickname).toBe('Budi')
    expect(useProgressStore.getState().attempts).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: strings.guide.clearLocalDataTitle }))

    expect(useSettingsStore.getState()).toMatchObject({
      nickname: '',
      fontScale: 'normal',
      highContrast: false,
      hintsEnabled: true,
    })
    expect(useProgressStore.getState().attempts).toHaveLength(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.guide.clearLocalData })).toBeInTheDocument()
  })
})

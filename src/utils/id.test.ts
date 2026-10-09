import { afterEach, describe, expect, it, vi } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  it('membuat id dengan prefiks bawaan att_', () => {
    const id = createId()

    expect(id.startsWith('att_')).toBe(true)
    expect(id.length).toBeGreaterThan('att_'.length)
  })

  it('mendukung prefiks kustom', () => {
    expect(createId('draf').startsWith('draf_')).toBe(true)
  })

  it('menghasilkan id unik untuk banyak pemanggilan', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId()))

    expect(ids.size).toBe(200)
  })

  it('memakai randomUUID bila tersedia', () => {
    expect(createId('att')).toMatch(/^att_[0-9a-f-]{36}$/)
  })

  it('jatuh ke penghasil waktu + acak bila crypto.randomUUID tidak ada', () => {
    vi.stubGlobal('crypto', {})

    const id = createId('att')

    expect(id.startsWith('att_')).toBe(true)
    expect(id).toMatch(/^att_[0-9a-z]+-[a-z0-9]+$/)
    expect(createId('att')).not.toBe(id)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})

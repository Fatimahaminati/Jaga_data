import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('menggabungkan beberapa string kelas dengan spasi', () => {
    expect(cx('btn', 'btn-primary')).toBe('btn btn-primary')
  })

  it('membuang nilai palsu (false, null, undefined, string kosong)', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('mengembalikan string kosong bila tidak ada kelas valid', () => {
    expect(cx()).toBe('')
    expect(cx(false, null, undefined)).toBe('')
  })

  it('mempertahankan kelas kondisional yang bernilai true', () => {
    const aktif = 1 > 0
    expect(cx('tetap', aktif && 'aktif')).toBe('tetap aktif')
  })
})

import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatDuration, formatScore } from './date'

describe('formatDateTime', () => {
  it('memformat tanggal ISO valid sesuai locale id-ID', () => {
    const formatted = formatDateTime('2026-01-02T03:04:05.000Z')

    expect(formatted).not.toBe('—')
    // Harus memuat hari, bulan, dan tahun dari tanggal tersebut (zona lokal).
    const date = new Date('2026-01-02T03:04:05.000Z')
    const day = new Intl.DateTimeFormat('id-ID', { day: 'numeric' }).format(date)
    expect(formatted).toContain(day)
    expect(formatted).toMatch(/\d{4}/)
  })

  it('mengembalikan tanda hubung untuk tanggal rusak', () => {
    expect(formatDateTime('bukan-tanggal')).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })
})

describe('formatDate', () => {
  it('memformat tanggal saja tanpa jam', () => {
    const formatted = formatDate('2026-01-02T03:04:05.000Z')

    expect(formatted).not.toBe('—')
    expect(formatted).toMatch(/\d{4}/)
  })

  it('mengembalikan tanda hubung untuk tanggal rusak', () => {
    expect(formatDate('tidak-ada')).toBe('—')
  })
})

describe('formatDuration', () => {
  it('menampilkan detik saja bila di bawah satu menit', () => {
    expect(formatDuration(0)).toBe('0 detik')
    expect(formatDuration(1400)).toBe('1 detik')
    expect(formatDuration(59_400)).toBe('59 detik')
  })

  it('menampilkan menit dan detik', () => {
    expect(formatDuration(60_000)).toBe('1 menit 0 detik')
    expect(formatDuration(90_000)).toBe('1 menit 30 detik')
    expect(formatDuration(65_000)).toBe('1 menit 5 detik')
  })

  it('membatasi durasi negatif ke nol', () => {
    expect(formatDuration(-500)).toBe('0 detik')
  })
})

describe('formatScore', () => {
  it('menampilkan bilangan bulat apa adanya', () => {
    expect(formatScore(0)).toBe('0')
    expect(formatScore(85)).toBe('85')
    expect(formatScore(100)).toBe('100')
  })

  it('menampilkan satu angka di belakang koma untuk desimal', () => {
    expect(formatScore(85.4)).toBe('85.4')
    expect(formatScore(72.55)).toBe('72.5')
    expect(formatScore(-0.5)).toBe('-0.5')
  })
})

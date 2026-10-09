import { describe, expect, it } from 'vitest'
import { migrate, MIGRATIONS } from './migrations'

describe('migrate', () => {
  it('menaikkan data dari v0 ke v1', () => {
    const result = migrate({ schemaVersion: 0, state: { attempts: [] } }, 1)

    expect(result).toEqual({ schemaVersion: 1, state: { attempts: [] } })
  })

  it('mengembalikan data apa bila versi sudah sesuai', () => {
    const result = migrate({ schemaVersion: 1, state: { nickname: 'Budi' } }, 1)
    expect(result).toEqual({ schemaVersion: 1, state: { nickname: 'Budi' } })
  })

  it('menolak payload yang bukan objek', () => {
    expect(migrate(null, 1)).toBeNull()
    expect(migrate('rusak', 1)).toBeNull()
    expect(migrate([1, 2, 3], 1)).toBeNull()
  })

  it('menolak payload tanpa versi atau tanpa state', () => {
    expect(migrate({ state: {} }, 1)).toBeNull()
    expect(migrate({ schemaVersion: 1 }, 1)).toBeNull()
    expect(migrate({ schemaVersion: 'satu', state: {} }, 1)).toBeNull()
  })

  it('menolak data dengan versi lebih baru daripada yang dikenal', () => {
    expect(migrate({ schemaVersion: 99, state: {} }, 1)).toBeNull()
  })

  it('menolak bila langkah migrasi tidak tersedia', () => {
    expect(migrate({ schemaVersion: 0, state: {} }, 5)).toBeNull()
  })

  it('menerapkan seluruh langkah migrasi secara berurutan', () => {
    const versions = Object.keys(MIGRATIONS)
      .map(Number)
      .sort((a, b) => a - b)
    expect(versions[0]).toBe(1)
    for (let i = 1; i < versions.length; i += 1) {
      expect(versions[i]).toBe(versions[i - 1] + 1)
    }
  })
})

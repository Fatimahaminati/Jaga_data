import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createLocalStorageRepository } from './localStorageRepo'

const schema = z.object({ n: z.number() })

class FakeStorage implements Storage {
  private store = new Map<string, string>()
  failOnWrite = false
  failOnRead = false
  failOnRemove = false
  failOnKey = false
  nullKey = false

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    if (this.failOnRead) throw new Error('SecurityError: pembacaan diblokir')
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    if (this.failOnKey) throw new Error('SecurityError: enumerasi diblokir')
    if (this.nullKey) return null
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    if (this.failOnRemove) throw new Error('SecurityError: penghapusan diblokir')
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    if (this.failOnWrite) {
      const error = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'
      throw error
    }
    this.store.set(key, value)
  }
}

describe('createLocalStorageRepository', () => {
  it('menulis dan membaca data yang valid', () => {
    const repo = createLocalStorageRepository({ storage: new FakeStorage() })

    expect(repo.write('pdp:uji', { n: 1 })).toBe(true)
    expect(repo.read('pdp:uji', schema)).toEqual({ n: 1 })
    expect(repo.isAvailable()).toBe(true)
  })

  it('mengembalikan null untuk kunci yang tidak ada', () => {
    const repo = createLocalStorageRepository({ storage: new FakeStorage() })
    expect(repo.read('pdp:kosong', schema)).toBeNull()
  })

  it('menghapus data rusak (bukan JSON) dengan aman', () => {
    const storage = new FakeStorage()
    storage.setItem('pdp:rusak', '{tidak-valid')
    const repo = createLocalStorageRepository({ storage })

    expect(repo.read('pdp:rusak', schema)).toBeNull()
    expect(storage.getItem('pdp:rusak')).toBeNull()
  })

  it('menghapus data yang tidak sesuai skema dengan aman', () => {
    const storage = new FakeStorage()
    storage.setItem('pdp:salah', JSON.stringify({ n: 'bukan-angka' }))
    const repo = createLocalStorageRepository({ storage })

    expect(repo.read('pdp:salah', schema)).toBeNull()
    expect(storage.getItem('pdp:salah')).toBeNull()
  })

  it('jatuh ke memori saat kuota penuh', () => {
    const storage = new FakeStorage()
    const repo = createLocalStorageRepository({ storage })

    storage.failOnWrite = true
    expect(repo.write('pdp:kuota', { n: 7 })).toBe(false)
    expect(repo.read('pdp:kuota', schema)).toEqual({ n: 7 })
  })

  it('tetap berfungsi dengan memori bila penyimpanan tidak tersedia', () => {
    const repo = createLocalStorageRepository({ storage: null })

    expect(repo.isAvailable()).toBe(false)
    expect(repo.write('pdp:memori', { n: 3 })).toBe(false)
    expect(repo.read('pdp:memori', schema)).toEqual({ n: 3 })
    expect(repo.listKeys('pdp:')).toEqual(['pdp:memori'])
    repo.remove('pdp:memori')
    expect(repo.read('pdp:memori', schema)).toBeNull()
  })

  it('listKeys mengikuti prefiks dan clearPrefix menghapus selektif', () => {
    const repo = createLocalStorageRepository({ storage: new FakeStorage() })

    repo.write('pdp:draft:a', { n: 1 })
    repo.write('pdp:draft:b', { n: 2 })
    repo.write('lain:prefix', { n: 3 })

    expect(repo.listKeys('pdp:draft:')).toEqual(['pdp:draft:a', 'pdp:draft:b'])
    repo.clearPrefix('pdp:draft:')
    expect(repo.listKeys('pdp:draft:')).toEqual([])
    expect(repo.read('lain:prefix', schema)).toEqual({ n: 3 })
  })

  it('remove menghapus data', () => {
    const repo = createLocalStorageRepository({ storage: new FakeStorage() })
    repo.write('pdp:hapus', { n: 1 })
    repo.remove('pdp:hapus')
    expect(repo.read('pdp:hapus', schema)).toBeNull()
  })

  it('menjatuhkan ke memori bila pembacaan backend melempar', () => {
    const storage = new FakeStorage()
    const repo = createLocalStorageRepository({ storage })

    storage.failOnWrite = true
    expect(repo.write('pdp:terblokir', { n: 9 })).toBe(false)

    storage.failOnRead = true
    expect(repo.read('pdp:terblokir', schema)).toEqual({ n: 9 })
    expect(repo.read('pdp:tidak-disimpan', schema)).toBeNull() // tidak ada di memori mana pun
    expect(() => storage.getItem('pdp:terblokir')).toThrow() // akses langsung pun ikut diblokir
  })

  it('mengabaikan galat saat menghapus data dari backend', () => {
    const storage = new FakeStorage()
    const repo = createLocalStorageRepository({ storage })
    repo.write('pdp:terkunci', { n: 2 })
    storage.setItem('pdp:rusak-2', '{tidak-valid')

    storage.failOnRemove = true
    expect(() => repo.remove('pdp:terkunci')).not.toThrow()

    // Penghapusan internal saat validasi gagal juga tidak ikut melempar.
    expect(() => repo.read('pdp:rusak-2', schema)).not.toThrow()
    expect(repo.read('pdp:rusak-2', schema)).toBeNull()
  })

  it('listKeys tetap mengembalikan kunci memori bila enumerasi backend gagal', () => {
    const storage = new FakeStorage()
    const repo = createLocalStorageRepository({ storage })

    // Satu kunci hanya di memori, satu lagi tersimpan di backend.
    storage.failOnWrite = true
    repo.write('pdp:hanya-memori', { n: 1 })
    storage.failOnWrite = false
    repo.write('pdp:backend', { n: 2 })

    storage.failOnKey = true
    expect(repo.listKeys('pdp:')).toEqual(['pdp:hanya-memori'])
    expect(() => repo.clearPrefix('pdp:')).not.toThrow()
  })

  it('mengabaikan kunci null saat enumerasi backend', () => {
    const storage = new FakeStorage()
    const repo = createLocalStorageRepository({ storage })
    repo.write('pdp:ada', { n: 1 })

    storage.nullKey = true
    expect(repo.listKeys('pdp:')).toEqual([])
  })

  it('write mengembalikan false bila nilai tidak bisa diserialisasi', () => {
    const repo = createLocalStorageRepository({ storage: new FakeStorage() })
    const circular: Record<string, unknown> = { n: 1 }
    circular.diri = circular

    expect(repo.write('pdp:circular', circular)).toBe(false)
    expect(repo.read('pdp:circular', schema)).toBeNull()
  })

  it('menganggap penyimpanan tidak tersedia bila localStorage diblokir peramban', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: localStorage diblokir')
      },
    })

    try {
      const repo = createLocalStorageRepository()
      expect(repo.isAvailable()).toBe(false)
      expect(repo.write('pdp:diblokir', { n: 5 })).toBe(false)
      expect(repo.read('pdp:diblokir', schema)).toEqual({ n: 5 })
      expect(repo.listKeys('pdp:')).toEqual(['pdp:diblokir'])
    } finally {
      if (original) {
        Object.defineProperty(window, 'localStorage', original)
      } else {
        Reflect.deleteProperty(window, 'localStorage')
      }
    }
  })
})

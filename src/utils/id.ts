/** ID unik untuk percobaan — tanpa dependensi, berjalan di sisi klien. */
export function createId(prefix = 'att'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${random}`
}

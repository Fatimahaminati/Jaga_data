const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateOnlyFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateOnlyFormatter.format(date)
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} detik`
  return `${minutes} menit ${seconds} detik`
}

/** Skor ditampilkan dengan satu angka di belakang koma tanpa nol berlebih. */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

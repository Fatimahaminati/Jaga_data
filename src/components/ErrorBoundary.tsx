import { Component, type ErrorInfo, type ReactNode } from 'react'
import { strings } from '@/content/strings/id'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Penangkap error runtime agar pengguna melihat pesan yang jelas,
 * bukan layar kosong. (Data lokal tidak terpengaruh.)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Tanpa analitik: hanya dicetak ke konsol developer.
    console.error('Kesalahan aplikasi:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card">
        <p className="fs-h1 font-extrabold text-accent-600">!</p>
        <h1 className="mt-3 font-extrabold text-ink-900">{strings.errors.general}</h1>
        <p className="mt-2 break-words fs-small text-ink-600">{this.state.error.message}</p>
        <button type="button" className="btn btn-primary mt-5" onClick={this.handleReload}>
          {strings.common.reset}
        </button>
      </div>
    )
  }
}

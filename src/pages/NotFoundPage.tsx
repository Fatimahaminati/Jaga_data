import { strings } from '@/content/strings/id'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export default function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <p className="fs-score font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 font-extrabold text-ink-900">{strings.errors.notFoundTitle}</h1>
      <p className="mt-2 fs-small text-ink-600">{strings.errors.notFoundBody}</p>
      <Link to="/" className="btn btn-primary mt-5 inline-flex">
        {strings.errors.backHome}
      </Link>
    </Card>
  )
}

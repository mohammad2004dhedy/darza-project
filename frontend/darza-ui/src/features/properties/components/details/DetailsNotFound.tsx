import { Link } from 'react-router'
export function DetailsNotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold">الإعلان غير موجود</h1>
      <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-primary">
        العودة للرئيسية
      </Link>
    </section>
  )
}

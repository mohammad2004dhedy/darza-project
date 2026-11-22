import { useFeed } from '../hooks'
import { PropertyList } from './PropertyList'

export function PropertyFeed() {
  const feed = useFeed()
  return (
    <section aria-labelledby="feed-title" className="space-y-6">
      <header className="space-y-1">
        <h1 id="feed-title" className="text-2xl font-bold text-primary">
          أحدث العقارات
        </h1>
        <p className="text-text-muted">تصفّح العقارات المعروضة للبيع والإيجار.</p>
      </header>
      <p className="text-sm text-text-muted">جميع العقارات تمت مراجعتها قبل النشر</p>
      <PropertyList query={feed} />
    </section>
  )
}

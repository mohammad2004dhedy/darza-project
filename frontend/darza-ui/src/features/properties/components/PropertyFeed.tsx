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
      <PropertyList query={feed} />
    </section>
  )
}

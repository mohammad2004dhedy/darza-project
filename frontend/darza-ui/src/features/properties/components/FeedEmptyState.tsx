import { House } from 'lucide-react'
import { EmptyState } from '../../../components/ui/EmptyState'

export function FeedEmptyState({
  title = 'ما في عقارات معروضة حاليًا',
  description = 'ارجع لاحقًا لتشوف الإعلانات الجديدة.',
}: {
  title?: string
  description?: string
}) {
  return <EmptyState title={title} description={description} icon={<House />} />
}

import type { PropertyUserResponse } from '../../../../types/api'
import { PropertyCardPublisher } from '../PropertyCardPublisher'
export function PublisherCard({ user }: { user: PropertyUserResponse }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-bold">الناشر</h2>
      <PropertyCardPublisher user={user} prominent />
    </section>
  )
}

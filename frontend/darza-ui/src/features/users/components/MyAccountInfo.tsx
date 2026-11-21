import type { MyProfileUserResponse } from '../../../types/api'

export function MyAccountInfo({ user }: { user: MyProfileUserResponse }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-bold">معلومات الحساب</h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-text-muted">البريد الإلكتروني</dt>
          <dd dir="ltr" className="text-start wrap-anywhere">
            {user.email}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-text-muted">رقم الهاتف</dt>
          <dd dir="ltr" className="text-start">
            {user.phoneNumber}
          </dd>
        </div>
        {user.address && (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-text-muted">العنوان</dt>
            <dd className="wrap-anywhere">{user.address}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

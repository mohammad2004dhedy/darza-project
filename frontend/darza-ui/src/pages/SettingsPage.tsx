import { Settings } from 'lucide-react'
import { BackButton } from '../components/ui/BackButton'
import { ButtonLink } from '../components/ui/ButtonLink'
import { DeleteAccount } from '../features/users/settings/DeleteAccount'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <nav aria-label="إعدادات الحساب" className="rounded-xl border border-border bg-surface p-4">
        <ButtonLink to="/settings/account" variant="ghost" fullWidth className="justify-start">
          <Settings className="size-5" aria-hidden="true" />
          تعديل الحساب
        </ButtonLink>
      </nav>
      <DeleteAccount />
    </div>
  )
}

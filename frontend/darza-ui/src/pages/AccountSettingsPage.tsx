import { BackButton } from '../components/ui/BackButton'
import { AccountSettings } from '../features/users/account/AccountSettings'

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold">تعديل الحساب</h1>
      <AccountSettings />
    </div>
  )
}

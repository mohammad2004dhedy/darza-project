import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import type { MyProfileUserResponse } from '../../../types/api'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { PhoneField } from '../../../components/form/PhoneField'
import { FormError } from '../../../components/form/FormError'
import { LocationFields } from '../../location/components/LocationFields'
import { AvatarEditor } from './AvatarEditor'
import { useAccountForm } from './useAccountForm'

export function AccountForm({ profile }: { profile: MyProfileUserResponse }) {
  const state = useAccountForm(profile)
  const {
    register,
    formState: { errors, isSubmitting },
  } = state.form
  const busy = isSubmitting || state.uploading
  return (
    <form noValidate onSubmit={state.onSubmit} className="mx-auto max-w-lg space-y-6">
      <AvatarEditor
        displayName={profile.displayName}
        originalUrl={profile.profileImageUrl}
        value={state.avatar}
        onChange={state.setAvatar}
        onBusy={state.setUploading}
        disabled={busy}
        uploading={state.uploading}
      />
      <fieldset disabled={busy} className="space-y-5">
        <FormField label="الاسم" required error={errors.displayName?.message}>
          <Input {...register('displayName')} autoComplete="name" maxLength={100} />
        </FormField>
        <FormField label="الإيميل">
          <Input value={profile.email} readOnly type="email" dir="ltr" autoComplete="email" />
        </FormField>
        <PhoneField {...state.phone} disabled={busy} />
        <LocationFields
          cityId={state.cityId}
          city={state.city}
          town={state.town}
          cityError={errors.cityId?.message}
          townError={errors.townId?.message}
        />
        <FormField label="العنوان" hint="اختياري" error={errors.address?.message}>
          <Input {...register('address')} autoComplete="street-address" maxLength={255} />
        </FormField>
        <FormError message={state.formError} />
        {!state.unsaved && <p className="text-sm text-text-muted">لا توجد تغييرات للحفظ</p>}
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting} disabled={state.uploading || !state.unsaved}>
            حفظ
          </Button>
          <Button variant="outline" onClick={state.cancel}>
            إلغاء
          </Button>
        </div>
      </fieldset>
      <ConfirmModal
        open={state.leave.confirming}
        title="تغييرات غير محفوظة"
        message="لديك تغييرات غير محفوظة، هل تريد المغادرة؟"
        onCancel={state.leave.cancel}
        onConfirm={state.leave.confirm}
      />
    </form>
  )
}

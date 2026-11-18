import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { PasswordField } from '../../../components/form/PasswordField'
import { PhoneField } from '../../../components/form/PhoneField'
import { FormError } from '../../../components/form/FormError'
import { SubmitButton } from '../../../components/form/SubmitButton'
import { LocationFields } from '../../location/components/LocationFields'
import { useRegisterForm } from '../hooks/useRegisterForm'

export function RegisterForm() {
  const { form, formError, onSubmit, phone, cityId, city, town } = useRegisterForm()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form
  return (
    <form noValidate onSubmit={onSubmit}>
      <fieldset disabled={isSubmitting} className="space-y-5">
        <FormField label="الاسم" required error={errors.displayName?.message}>
          <Input {...register('displayName')} autoComplete="name" maxLength={100} />
        </FormField>
        <FormField label="الإيميل" required error={errors.email?.message}>
          <Input
            {...register('email')}
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            maxLength={255}
          />
        </FormField>
        <PasswordField
          {...register('password')}
          label="كلمة المرور"
          required
          autoComplete="new-password"
          hint="من 8 لـ 64 حرف"
          error={errors.password?.message}
        />
        <PhoneField {...phone} disabled={isSubmitting} />
        <LocationFields
          cityId={cityId}
          city={city}
          town={town}
          cityError={errors.cityId?.message}
          townError={errors.townId?.message}
        />
        <FormField label="العنوان (اختياري)" error={errors.address?.message}>
          <Input {...register('address')} autoComplete="street-address" maxLength={255} />
        </FormField>
        <FormError message={formError} />
        <SubmitButton loading={isSubmitting}>إنشاء الحساب</SubmitButton>
      </fieldset>
    </form>
  )
}

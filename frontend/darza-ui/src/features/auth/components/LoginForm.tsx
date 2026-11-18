import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { PasswordField } from '../../../components/form/PasswordField'
import { FormError } from '../../../components/form/FormError'
import { SubmitButton } from '../../../components/form/SubmitButton'
import { useLoginForm } from '../hooks/useLoginForm'

export function LoginForm() {
  const { form, formError, onSubmit } = useLoginForm()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form
  return (
    <form noValidate onSubmit={onSubmit}>
      <fieldset disabled={isSubmitting} className="space-y-5">
        <FormField label="الإيميل" required error={errors.email?.message}>
          <Input
            {...register('email')}
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
          />
        </FormField>
        <PasswordField
          {...register('password')}
          label="كلمة المرور"
          required
          autoComplete="current-password"
          error={errors.password?.message}
        />
        <FormError message={formError} />
        <SubmitButton loading={isSubmitting}>تسجيل الدخول</SubmitButton>
      </fieldset>
    </form>
  )
}

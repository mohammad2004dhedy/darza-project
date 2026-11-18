import { useState } from 'react'
import { useController, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { authApi } from '../../../api/authApi'
import { ApiError } from '../../../api/client'
import { useAuth } from '../../../context/auth'
import { useToast } from '../../../components/ui/useToast'
import { usePhoneInput } from '../../../components/form/usePhoneInput'
import { resolveSubmitError } from '../../../lib/formErrors'
import { registerSchema, type RegisterValues } from '../schemas'

const REGISTER_FIELDS = [
  'displayName',
  'email',
  'password',
  'countryCode',
  'phoneNumber',
  'townId',
  'address',
] as const

export function useRegisterForm() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      countryCode: '970',
      phoneNumber: '',
      cityId: '',
      townId: '',
      address: '',
    },
  })
  const { control, setValue, setError } = form

  const code = useController({ control, name: 'countryCode' })
  const number = useController({ control, name: 'phoneNumber' })
  const phoneInput = usePhoneInput(
    { countryCode: code.field.value, phoneNumber: number.field.value },
    (next) => {
      code.field.onChange(next.countryCode)
      number.field.onChange(next.phoneNumber)
    },
  )
  const phone = {
    ...phoneInput,
    countryCode: code.field.value,
    phoneNumber: number.field.value,
    onBlur: number.field.onBlur,
    error: number.fieldState.error?.message ?? code.fieldState.error?.message,
  }

  const cityId = useWatch({ control, name: 'cityId' })
  const city = form.register('cityId', { onChange: () => setValue('townId', '') })
  const town = form.register('townId')

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await authApi.register({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
        countryCode: values.countryCode,
        phoneNumber: values.phoneNumber,
        townId: Number(values.townId),
        address: values.address || undefined,
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', {
          type: 'server',
          message: 'هاد الإيميل مسجّل من قبل، جرّب تسجّل دخول',
        })
      } else {
        setFormError(resolveSubmitError(error, REGISTER_FIELDS, setError))
      }
      return
    }
    // Registration returns a profile, not a session, so sign in with the same credentials.
    try {
      login(await authApi.login({ email: values.email, password: values.password }))
    } catch {
      showToast('انعمل حسابك بنجاح، سجّل دخولك')
      void navigate('/login', { replace: true })
    }
  })

  return { form, formError, onSubmit, phone, cityId, city, town }
}

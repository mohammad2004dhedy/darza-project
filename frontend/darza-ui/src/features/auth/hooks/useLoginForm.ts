import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../../../api/authApi'
import { useAuth } from '../../../context/auth'
import { resolveSubmitError } from '../../../lib/formErrors'
import { loginSchema, type LoginValues } from '../schemas'

const LOGIN_FIELDS = ['email', 'password'] as const

export function useLoginForm() {
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Saving the session lets GuestRoute redirect to location.state.from.
  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      login(await authApi.login(values))
    } catch (error) {
      setFormError(resolveSubmitError(error, LOGIN_FIELDS, form.setError))
    }
  })
  return { form, formError, onSubmit }
}

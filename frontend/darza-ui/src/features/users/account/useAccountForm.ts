import { useRef, useState, type FormEvent } from 'react'
import { useController, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/auth'
import { useToast } from '../../../components/ui/useToast'
import { usePhoneInput } from '../../../components/form/usePhoneInput'
import { applyPhoneInput, initialPhoneInput } from '../../../lib/phone'
import { resolveSubmitError } from '../../../lib/formErrors'
import type { MyProfileUserResponse } from '../../../types/api'
import { accountSchema, type AccountValues, type AccountSubmission } from './schema'
import { deleteProfileImage, saveAccount, type AvatarChange } from './api'

export function useAccountForm(profile: MyProfileUserResponse) {
  const auth = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const cache = useQueryClient()
  const submitting = useRef(false)
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: 'unchanged' })
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<AccountValues, unknown, AccountSubmission>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      displayName: profile.displayName,
      ...applyPhoneInput(initialPhoneInput, profile.phoneNumber),
      cityId: profile.town ? String(profile.town.cityId) : '',
      townId: profile.town ? String(profile.town.townId) : '',
      address: profile.address ?? '',
    },
  })
  const countryCode = useController({ control: form.control, name: 'countryCode' })
  const phoneNumber = useController({ control: form.control, name: 'phoneNumber' })
  const phoneInput = usePhoneInput(
    { countryCode: countryCode.field.value, phoneNumber: phoneNumber.field.value },
    (next) => {
      countryCode.field.onChange(next.countryCode)
      phoneNumber.field.onChange(next.phoneNumber)
    },
  )
  const phone = {
    ...phoneInput,
    countryCode: countryCode.field.value,
    phoneNumber: phoneNumber.field.value,
    onBlur: phoneNumber.field.onBlur,
    error: phoneNumber.fieldState.error?.message ?? countryCode.fieldState.error?.message,
  }
  const cityId = useWatch({ control: form.control, name: 'cityId' })
  const townId = useWatch({ control: form.control, name: 'townId' })
  const city = {
    ...form.register('cityId', {
      onChange: () => form.setValue('townId', '', { shouldValidate: true }),
    }),
    value: cityId,
  }
  const town = { ...form.register('townId'), value: townId }
  const submit = form.handleSubmit(async (values) => {
    if (uploading) return
    setFormError(null)
    try {
      await saveAccount(
        {
          displayName: values.displayName,
          countryCode: values.countryCode,
          phoneNumber: values.phoneNumber,
          townId: Number(values.townId),
          address: values.address,
        },
        avatar.kind === 'removed' ? { kind: 'unchanged' } : avatar,
      )
      if (auth.token && auth.role && auth.expiresAt && auth.userId !== null) {
        auth.login({
          token: auth.token,
          role: auth.role,
          expiresAt: auth.expiresAt,
          userId: auth.userId,
          displayName: values.displayName,
        })
      }
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['users'] }),
        cache.invalidateQueries({ queryKey: ['properties'] }),
      ])
      if (avatar.kind === 'removed') {
        const removeAvatar = async () => {
          try {
            await deleteProfileImage()
            setAvatar({ kind: 'unchanged' })
            await cache.invalidateQueries({ queryKey: ['users'] })
            showToast('تم حفظ الحساب')
            navigate(-1)
          } catch {
            showToast('تم حفظ بياناتك، لكن تعذر حذف الصورة', {
              label: 'إعادة المحاولة',
              onClick: () => {
                if (submitting.current) return
                submitting.current = true
                void removeAvatar().finally(() => { submitting.current = false })
              },
            })
          }
        }
        await removeAvatar()
        return
      }
      showToast('تم حفظ الحساب')
      navigate(-1)
    } catch (error) {
      setFormError(
        resolveSubmitError(
          error,
          ['displayName', 'countryCode', 'phoneNumber', 'cityId', 'townId', 'address'],
          form.setError,
        ),
      )
    }
  })
  const onSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (submitting.current || uploading) return
    submitting.current = true
    try {
      await submit(event)
    } finally {
      submitting.current = false
    }
  }
  return {
    form,
    phone,
    cityId,
    city,
    town,
    avatar,
    setAvatar,
    uploading,
    setUploading,
    formError,
    onSubmit,
    cancel: () => navigate(-1),
  }
}

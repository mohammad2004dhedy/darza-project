import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { ApiError } from '../../api/client'
import { useToast } from '../../components/ui/useToast'
import { useAuth } from '../../context/auth'
import { resolveSubmitError } from '../../lib/formErrors'
import { createProperty, updateProperty } from './api'
import type { PropertyDetailsResponse } from '../../types/api'
import { editValues } from './editValues'
import { invalidatePropertyQueries } from './invalidate'
import { buildPayload, defaultValues, formSchema, normalizeNumber, type FormValues } from './schema'
import { useImageUploader } from './useImageUploader'

import { stepFields, useWizardNavigation } from './useWizardNavigation'

const knownFields = stepFields.flat()
type NumberField = 'price' | 'areaSize' | 'rooms' | 'bathrooms' | 'latitude' | 'longitude'

export function usePropertyWizard(property?: PropertyDetailsResponse) {
  const initial = useRef(property).current
  const { userId } = useAuth()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial ? editValues(initial) : defaultValues,
  })
  const uploader = useImageUploader(initial?.images)
  const initialImages = useRef(initial ? uploader.items.map((item) => item.id).join(',') : '')
  const [confirming, setConfirming] = useState(false)
  const { showToast } = useToast()
  const client = useQueryClient()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [locationState, setLocationState] = useState<
    | { status: 'idle' | 'loading' }
    | { status: 'success'; accuracy?: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' })
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const locationRequest = useRef(0)
  const mounted = useRef(true)
  const { setValue, watch } = form

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    // The subscription enforces dependent values without render-time updates.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((values, { name }) => {
      if ((name === 'propertyType' || name === 'listingType') && values.propertyType === 'LAND') {
        if (values.listingType !== 'SELL') setValue('listingType', 'SELL', { shouldDirty: true })
      }
      if (name === 'cityId') setValue('townId', '', { shouldDirty: true })
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue])

  useEffect(() => {
    setValue(
      'imagePaths',
      uploader.items
        .filter((item) => item.kind === 'existing' || item.blob)
        .map((item) => item.path ?? item.id),
      { shouldValidate: false, shouldDirty: true },
    )
  }, [uploader.items, setValue])

  const currentValues = useWatch({ control: form.control })
  const [baseline, setBaseline] = useState(() => initial ? editValues(initial) : defaultValues)
  const unsaved = Boolean(
    (Object.keys(baseline) as (keyof FormValues)[]).some((key) =>
      JSON.stringify(currentValues[key]) !== JSON.stringify(baseline[key]),
    ) || uploader.items.map((item) => item.id).join(',') !== initialImages.current
  )
  const leave = useUnsavedChanges(unsaved)

  function imagesReady() {
    if (
      uploader.isProcessing ||
      uploader.items.length < 1 ||
      uploader.items.length > 8 ||
      uploader.items.some((item) => item.kind === 'new' && !item.blob)
    ) {
      form.setError('imagePaths', {
        type: 'validate',
        message: 'أضف صورة صالحة واحدة على الأقل وانتظر اكتمال معالجة جميع الصور',
      })
      return false
    }
    return true
  }

  const navigation = useWizardNavigation(
    form,
    Boolean(initial),
    !uploader.isProcessing &&
      uploader.items.length >= 1 &&
      uploader.items.length <= 8 &&
      uploader.items.every((item) => item.kind === 'existing' || Boolean(item.blob)),
  )
  const { step } = navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [step])
  const setStep = navigation.go

  async function next() {
    if (locked.current || step >= 6) return
    await setStep(navigation.returningToReview ? 6 : step + 1)
  }

  function back() {
    if (locked.current) return
    navigation.setStep(Math.max(0, step - 1))
  }

  function registerNumber(name: NumberField) {
    const registered = form.register(name)
    return {
      ...registered,
      onChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.target.value = normalizeNumber(event.target.value)
        return registered.onChange(event)
      },
    }
  }

  function locate() {
    const request = ++locationRequest.current
    setLocationState({ status: 'loading' })
    if (!navigator.geolocation) {
      setLocationState({ status: 'error', message: 'المتصفح لا يدعم تحديد الموقع' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mounted.current || request !== locationRequest.current) return
        setValue('latitude', coords.latitude.toFixed(6), { shouldDirty: true })
        setValue('longitude', coords.longitude.toFixed(6), { shouldDirty: true })
        void form.trigger(['latitude', 'longitude'])
        setLocationState({ status: 'success', accuracy: coords.accuracy })
      },
      ({ code }) => {
        if (!mounted.current || request !== locationRequest.current) return
        setLocationState({ status: 'error', message:
          code === 1
            ? 'لم يتم السماح بالوصول للموقع، فعّل الإذن من إعدادات المتصفح'
            : code === 2
              ? 'تعذّر تحديد الموقع الحالي. حاول مجدداً أو اختر الموقع من الخريطة'
              : code === 3
                ? 'انتهت مهلة تحديد الموقع. حاول مجدداً أو اختر الموقع من الخريطة'
                : 'تعذّر تحديد الموقع. يرجى المحاولة مجدداً',
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  function clearLocation() {
    locationRequest.current++
    setLocationState({ status: 'idle' })
    setValue('latitude', '', { shouldDirty: true })
    setValue('longitude', '', { shouldDirty: true })
    form.clearErrors(['latitude', 'longitude'])
  }

  function chooseLocation(latitude: number, longitude: number) {
    locationRequest.current++
    setLocationState({ status: 'success' })
    setValue('latitude', latitude.toFixed(6), { shouldDirty: true })
    setValue('longitude', longitude.toFixed(6), { shouldDirty: true })
    void form.trigger(['latitude', 'longitude'])
  }

  const mutation = useMutation({
    retry: false,
    mutationFn: async (values: FormValues) => {
      const imagePaths = await uploader.uploadAll()
      const payload = buildPayload(values, imagePaths)
      return initial ? updateProperty(initial.id, payload) : createProperty(payload)
    },
  })

  function jumpToError(fields: string[]) {
    const index = stepFields.findIndex((names) => names.some((name) => fields.includes(name)))
    if (index >= 0) setStep(index)
  }

  async function onSubmit(event?: FormEvent, confirmed = false) {
    event?.preventDefault()
    if (locked.current) return
    if (event && step !== 6) {
      await next()
      return
    }
    if (initial && !unsaved) return
    if (initial && !confirmed) {
      if (!imagesReady()) {
        setStep(4)
        return
      }
      if (!(await form.trigger())) {
        jumpToError(Object.keys(form.formState.errors))
        return
      }
      setConfirming(true)
      return
    }
    locked.current = true
    setBusy(true)
    setFormError(null)
    try {
      if (!imagesReady()) {
        setStep(4)
        return
      }
      await form.handleSubmit(
        async (values) => {
          try {
            const response = await mutation.mutateAsync(values)
            setBaseline(values)
            form.reset(values)
            initialImages.current = uploader.items.map((item) => item.id).join(',')
            setConfirming(false)
            await invalidatePropertyQueries(client, userId)
            showToast(
              response.postingStatus === 'PENDING'
                ? 'تم إرسال إعلانك للمراجعة وسيظهر للعامة بعد الموافقة'
                : initial
                  ? 'تم حفظ التعديلات'
                  : 'تم نشر إعلانك',
            )
            navigate(`/properties/${response.id}`)
          } catch (error) {
            setFormError(
              error instanceof ApiError
                ? resolveSubmitError(error, knownFields, form.setError)
                : error instanceof Error
                  ? error.message
                  : 'تعذر حفظ الإعلان، حاول مرة أخرى',
            )
            if (error instanceof ApiError) jumpToError(Object.keys(error.fieldErrors ?? {}))
          }
        },
        (errors) => jumpToError(Object.keys(errors)),
      )()
    } finally {
      locked.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return {
    form,
    editMode: Boolean(initial),
    confirming,
    unsaved,
    confirmingBack: leave.confirming,
    cancelBack: leave.cancel,
    confirmBack: leave.confirm,
    confirm: () => onSubmit(undefined, true),
    cancelConfirmation: () => {
      if (!locked.current) setConfirming(false)
    },
    ...navigation,
    setStep: (index: number) => {
      if (!locked.current) return navigation.go(index)
    },
    next,
    back,
    onSubmit,
    submit: () => onSubmit(),
    busy,
    formError,
    uploader,
    registerNumber,
    locate,
    clearLocation,
    locationState,
    locationError: locationState.status === 'error' ? locationState.message : null,
    locating: locationState.status === 'loading',
    chooseLocation,
  }
}

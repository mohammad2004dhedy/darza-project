import { useEffect, useRef, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type FieldPath } from 'react-hook-form'
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

export const stepFields: readonly FieldPath<FormValues>[][] = [
  ['propertyType', 'listingType'],
  ['price', 'currency', 'rentPeriod'],
  ['areaSize', 'rooms', 'bathrooms', 'furnished', 'hasBalcony'],
  ['cityId', 'townId', 'address', 'latitude', 'longitude'],
  ['imagePaths'],
  ['title', 'description'],
  [],
]
const knownFields = stepFields.flat()
type NumberField = 'price' | 'areaSize' | 'rooms' | 'bathrooms' | 'latitude' | 'longitude'

export function usePropertyWizard(property?: PropertyDetailsResponse) {
  const initial = useRef(property).current
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial ? editValues(initial) : defaultValues,
  })
  const uploader = useImageUploader(initial?.images)
  const initialImages = useRef(initial ? uploader.items.map((item) => item.id).join(',') : '')
  const [confirming, setConfirming] = useState(false)
  const { userId } = useAuth()
  const { showToast } = useToast()
  const client = useQueryClient()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const saved = useRef(false)
  const locationRequest = useRef(0)
  const mounted = useRef(true)
  const { setValue, watch } = form

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [step])

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

  const unsaved =
    form.formState.isDirty ||
    uploader.items.map((item) => item.id).join(',') !== initialImages.current
  useEffect(() => {
    if (!unsaved) return
    function preventUnload(event: BeforeUnloadEvent) {
      if (saved.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventUnload)
    return () => window.removeEventListener('beforeunload', preventUnload)
  }, [unsaved])

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

  async function next() {
    if (locked.current || step >= 6) return
    if (step === 4 && !imagesReady()) return
    if (await form.trigger(stepFields[step], { shouldFocus: true })) setStep(step + 1)
  }

  function back() {
    if (!locked.current) setStep((current) => Math.max(0, current - 1))
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
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError('تحديد الموقع غير متاح في هذا المتصفح')
      return
    }
    const request = ++locationRequest.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mounted.current || request !== locationRequest.current) return
        setValue('latitude', String(Number(coords.latitude.toFixed(6))), { shouldDirty: true })
        setValue('longitude', String(Number(coords.longitude.toFixed(6))), { shouldDirty: true })
        void form.trigger(['latitude', 'longitude'])
        setLocating(false)
      },
      ({ code }) => {
        if (!mounted.current || request !== locationRequest.current) return
        setLocating(false)
        setLocationError(
          code === 1
            ? 'تم رفض إذن الموقع، يمكنك السماح به من إعدادات المتصفح'
            : code === 3
              ? 'انتهت مهلة تحديد الموقع، حاول مرة أخرى'
              : 'تعذر تحديد موقعك الحالي، حاول مرة أخرى',
        )
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    )
  }

  function clearLocation() {
    locationRequest.current++
    setLocating(false)
    setLocationError(null)
    setValue('latitude', '', { shouldDirty: true })
    setValue('longitude', '', { shouldDirty: true })
    form.clearErrors(['latitude', 'longitude'])
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
            saved.current = true
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
    confirm: () => onSubmit(undefined, true),
    cancelConfirmation: () => {
      if (!locked.current) setConfirming(false)
    },
    step,
    setStep,
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
    locationError,
    locating,
  }
}

import { useEffect, useState } from 'react'
import { useWatch, type FieldPath, type UseFormReturn } from 'react-hook-form'
import { useLocation, useSearchParams } from 'react-router'
import { formSchema, type FormValues } from './schema'

export const stepFields: readonly FieldPath<FormValues>[][] = [
  ['propertyType', 'listingType'],
  ['price', 'currency', 'rentPeriod'],
  ['areaSize', 'rooms', 'bathrooms', 'furnished', 'hasBalcony'],
  ['cityId', 'townId', 'address', 'latitude', 'longitude'],
  ['imagePaths'],
  ['title', 'description'],
  [],
]

export function useWizardNavigation(
  form: UseFormReturn<FormValues>,
  editMode: boolean,
  imagesReady: boolean,
  restoredStep?: number,
) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [navigationSession] = useState(() => crypto.randomUUID())
  const ownNavigation = location.state?.wizardNavigationSession === navigationSession
  const values = useWatch({ control: form.control })
  const result = formSchema.safeParse(values)
  const valid = stepFields.map(
    (fields, index) =>
      (index !== 4 || imagesReady) &&
      (result.success ||
        !result.error.issues.some((issue) => fields.some((field) => field === issue.path[0]))),
  )
  valid[6] = valid.slice(0, 6).every(Boolean)
  const firstInvalid = valid.findIndex((value) => !value)
  const safeRestoredStep = Math.min(restoredStep ?? 0, firstInvalid < 0 ? 6 : firstInvalid)
  const requested = params.has('step') ? Number(params.get('step')) - 1 : safeRestoredStep
  const returningToReview = params.get('from') === 'review'
  function canVisit(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 6) return false
    if (index === 6) return valid.slice(0, 6).every(Boolean)
    return editMode || valid.slice(0, index).every(Boolean)
  }
  function destination(index: number, keepReview: boolean, external: boolean) {
    const blocked = (external && !canVisit(index)) || (index === 6 && !valid[6]) || (
      external && keepReview && firstInvalid >= 0
    )
    return {
      index: blocked ? (firstInvalid < 0 ? safeRestoredStep : firstInvalid) : index,
      keepReview: keepReview && !blocked,
    }
  }
  const resolved = ownNavigation && requested >= 0 && requested <= 6 && requested !== 6
    ? { index: requested, keepReview: returningToReview }
    : destination(requested, returningToReview, !ownNavigation)
  const step = resolved.index

  function goToStep(index: number, { keepReview = false, replace = false, external = false } = {}) {
    const target = destination(index, keepReview, external)
    const next = new URLSearchParams(params)
    next.set('step', String(target.index + 1))
    if (target.keepReview) next.set('from', 'review')
    else next.delete('from')
    setParams(next, {
      replace,
      state: { ...location.state, wizardNavigationSession: navigationSession },
    })
  }

  useEffect(() => {
    if (ownNavigation) return
    if (params.get('step') !== String(step + 1) || returningToReview !== resolved.keepReview) {
      goToStep(requested, { keepReview: returningToReview, replace: true, external: true })
    }
  })

  async function go(index: number, fromReview = false) {
    if (!Number.isInteger(index) || index < 0 || index > 6) return
    if (index === step) return
    if (!(await form.trigger(stepFields[step], { shouldFocus: true }))) return
    const fields = index === 6 ? stepFields.slice(0, 6).flat()
      : index > step ? stepFields.slice(0, index).flat() : stepFields[step]
    if (!(await form.trigger(fields, { shouldFocus: true }))) return
    if (index > step && valid.slice(0, index).some((value) => !value)) return
    goToStep(index, { keepReview: fromReview })
  }

  return {
    step,
    returningToReview,
    canVisit,
    completed: valid,
    go,
    setStep: (index: number) => {
      goToStep(index, {})
    },
    editStep: (index: number) => go(index, true),
  }
}

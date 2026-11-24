import { useEffect } from 'react'
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
  const values = useWatch({ control: form.control })
  const result = formSchema.safeParse(values)
  const valid = stepFields.map(
    (fields, index) =>
      (index !== 4 || imagesReady) &&
      (result.success ||
        !result.error.issues.some((issue) => fields.some((field) => field === issue.path[0]))),
  )
  const firstInvalid = valid.findIndex((value) => !value)
  const safeRestoredStep = Math.min(restoredStep ?? 0, firstInvalid < 0 ? 6 : firstInvalid)
  const requested = params.has('step') ? Number(params.get('step')) - 1 : safeRestoredStep
  const returningToReview = params.get('from') === 'review'
  function canVisit(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 6) return false
    return editMode || valid.slice(0, index).every(Boolean)
  }
  const blocked = !canVisit(requested)
  const step = blocked ? (firstInvalid < 0 ? safeRestoredStep : firstInvalid) : requested
  const discardReview = !editMode && (blocked || (returningToReview && !location.state?.wizardReviewAccess && firstInvalid >= 0))

  useEffect(() => {
    if (params.get('step') !== String(step + 1) || discardReview) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('step', String(step + 1))
          if (discardReview) next.delete('from')
          return next
        },
        { replace: true },
      )
    }
  }, [step, params, setParams, discardReview])

  function go(index: number, fromReview = false) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('step', String(index + 1))
        if (fromReview) next.set('from', 'review')
        else next.delete('from')
        return next
      },
      { state: { ...location.state, wizardReviewAccess: fromReview || (index === 6 && returningToReview) } },
    )
  }

  return {
    step,
    returningToReview,
    canVisit,
    completed: valid,
    go,
    setStep: (index: number) => {
      if (canVisit(index)) go(index)
    },
    editStep: (index: number) => go(index, true),
  }
}

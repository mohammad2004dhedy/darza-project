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
  const [visited, setVisited] = useState(() => new Set<number>([0]))
  const location = useLocation()
  const reviewOverride = location.state?.wizardReviewAccess === true
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
    if (editMode || (returningToReview && index === 6)) return true
    if (index === 6) return reviewOverride || valid.slice(0, 6).every(Boolean)
    return [...visited].some((seen) => seen >= index) || valid.slice(0, index).every(Boolean)
  }
  const step = canVisit(requested) ? requested : safeRestoredStep
  if (!visited.has(step)) setVisited(new Set([...visited, step]))

  useEffect(() => {
    if (params.get('step') !== String(step + 1)) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('step', String(step + 1))
          return next
        },
        { replace: true },
      )
    }
  }, [step, params, setParams])

  function go(index: number, fromReview = false) {
    setVisited((current) => new Set([...current, step, index]))
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('step', String(index + 1))
        if (fromReview) next.set('from', 'review')
        else next.delete('from')
        return next
      },
      { state: { ...location.state, wizardReviewAccess: index === 6 && returningToReview } },
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

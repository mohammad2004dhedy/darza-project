import { useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { DraftStorage, type PropertyDraft } from './DraftStorage'
import { defaultValues, type FormValues } from './schema'

export function usePropertyDraft(form: UseFormReturn<FormValues>, userId: number | null, step: number, hadImages: boolean, draft: PropertyDraft | null) {
  const [restored, setRestored] = useState(Boolean(draft))
  const [missingImages, setMissingImages] = useState(Boolean(draft?.values.hadImages))
  const stopped = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (userId == null) return
    function schedule() {
      clearTimeout(timer.current)
      if (stopped.current) return
      timer.current = setTimeout(() => {
        const values = form.getValues()
        const hasValues = Object.keys(defaultValues).some((key) => key !== 'imagePaths' && values[key as keyof FormValues] !== defaultValues[key as keyof FormValues])
        if (!stopped.current && (hasValues || hadImages || missingImages)) DraftStorage.save(userId!, step, values, hadImages || missingImages)
      }, 500)
    }
    schedule()
    const subscription = form.watch(schedule)
    return () => { subscription.unsubscribe(); clearTimeout(timer.current) }
  }, [form, userId, step, hadImages, missingImages])

  function clear() {
    stopped.current = true
    clearTimeout(timer.current)
    if (userId != null) DraftStorage.clear(userId)
  }
  function reset() {
    clear()
    form.reset(defaultValues)
    setRestored(false)
    setMissingImages(false)
    stopped.current = false
  }
  return { restored, missingImages, clear, reset }
}

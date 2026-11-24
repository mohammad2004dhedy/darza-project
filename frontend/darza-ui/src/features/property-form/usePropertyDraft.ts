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
    function flush() {
      if (timer.current === undefined) return
      clearTimeout(timer.current)
      timer.current = undefined
      const values = form.getValues()
      const hasValues = Object.keys(defaultValues).some((key) => key !== 'imagePaths' && values[key as keyof FormValues] !== defaultValues[key as keyof FormValues])
      if (!stopped.current && (hasValues || hadImages || missingImages)) DraftStorage.save(userId!, step, values, hadImages || missingImages)
    }
    function schedule() {
      clearTimeout(timer.current)
      timer.current = undefined
      if (stopped.current) return
      timer.current = setTimeout(flush, 500)
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flush()
    }
    schedule()
    const subscription = form.watch(schedule)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush()
    }
  }, [form, userId, step, hadImages, missingImages])

  function clear() {
    stopped.current = true
    clearTimeout(timer.current)
    timer.current = undefined
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

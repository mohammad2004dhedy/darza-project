// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, expect, it, vi } from 'vitest'
import { usePropertyDraft } from './usePropertyDraft'
import { DraftStorage } from './DraftStorage'
import { defaultValues, type FormValues } from './schema'

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers() })
function setup(userId: number | null = 7) {
  return renderHook(({ step }) => {
    const form = useForm<FormValues>({ defaultValues })
    return { form, draft: usePropertyDraft(form, userId, step, true, null) }
  }, { initialProps: { step: 0 } })
}
it('debounces fields and step and cancels pending saves after successful submission', () => {
  vi.useFakeTimers()
  const { result, rerender } = setup()
  act(() => { result.current.form.setValue('title', 'عقار'); vi.advanceTimersByTime(499) })
  expect(DraftStorage.read(7)).toBeNull()
  act(() => { vi.advanceTimersByTime(1) })
  expect(DraftStorage.read(7)?.values.title).toBe('عقار')
  rerender({ step: 2 })
  act(() => vi.advanceTimersByTime(500))
  expect(DraftStorage.read(7)?.step).toBe(2)
  act(() => { result.current.form.setValue('title', 'جديد'); result.current.draft.clear(); vi.advanceTimersByTime(500) })
  expect(DraftStorage.read(7)).toBeNull()
})
it('does not save in edit mode', () => {
  vi.useFakeTimers()
  const { result } = setup(null)
  act(() => { result.current.form.setValue('title', 'تعديل'); vi.advanceTimersByTime(500) })
  expect(DraftStorage.read(7)).toBeNull()
})
it('restarts restored drafts and clears the image reminder', () => {
  vi.useFakeTimers()
  DraftStorage.save(7, 4, { ...defaultValues, title: 'محفوظ' }, true)
  const saved = DraftStorage.read(7)!
  const { result } = renderHook(() => {
    const form = useForm<FormValues>({ defaultValues: { ...defaultValues, ...saved.values } })
    return { form, draft: usePropertyDraft(form, 7, 4, false, saved) }
  })
  expect(result.current.draft.restored).toBe(true)
  expect(result.current.draft.missingImages).toBe(true)
  act(() => result.current.draft.reset())
  expect(result.current.form.getValues('title')).toBe('')
  expect(result.current.draft.restored).toBe(false)
  expect(result.current.draft.missingImages).toBe(false)
  expect(DraftStorage.read(7)).toBeNull()
})

// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, expect, it, vi } from 'vitest'
import { usePropertyDraft } from './usePropertyDraft'
import { DraftStorage } from './DraftStorage'
import { defaultValues, type FormValues } from './schema'

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks() })
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

it.each(['unmount', 'pagehide', 'hidden'] as const)('flushes the latest pending fields on %s', (event) => {
  vi.useFakeTimers()
  const { result, rerender, unmount } = setup()
  rerender({ step: 3 })
  act(() => {
    result.current.form.setValue('title', 'أحدث عنوان')
    result.current.form.setValue('description', 'أحدث وصف')
    vi.advanceTimersByTime(499)
  })
  if (event === 'unmount') unmount()
  else act(() => {
    if (event === 'pagehide') window.dispatchEvent(new Event('pagehide'))
    else {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    }
  })
  expect(DraftStorage.read(7)).toMatchObject({ step: 3, values: { title: 'أحدث عنوان', description: 'أحدث وصف', hadImages: true } })
})
it('does not flush when the page remains visible', () => {
  vi.useFakeTimers()
  const { result } = setup()
  act(() => result.current.form.setValue('title', 'جديد'))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(DraftStorage.read(7)).toBeNull()
})
it.each([7, null])('does not resurrect cleared drafts or save edit-mode lifecycle changes (user %s)', (userId) => {
  vi.useFakeTimers()
  const { result, unmount } = setup(userId)
  act(() => {
    result.current.form.setValue('title', 'غير محفوظ')
    if (userId !== null) result.current.draft.clear()
    window.dispatchEvent(new Event('pagehide'))
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  unmount()
  act(() => vi.advanceTimersByTime(500))
  expect(DraftStorage.read(7)).toBeNull()
})

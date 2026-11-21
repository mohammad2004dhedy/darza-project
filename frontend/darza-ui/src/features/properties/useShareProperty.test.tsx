// @vitest-environment jsdom
import { act, cleanup, renderHook, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/ui/ToastProvider'
import { useShareProperty } from './useShareProperty'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it('uses native share when available', async () => {
  const share = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { share })
  const { result } = renderHook(() => useShareProperty(7, 'بيت', 'بيتونيا', 'رام الله'), {
    wrapper: ToastProvider,
  })
  await act(() => result.current())
  expect(share).toHaveBeenCalledWith({
    title: 'بيت',
    text: 'بيت - بيتونيا، رام الله',
    url: `${window.location.origin}/properties/7`,
  })
})
it('copies the URL with a toast when native share is absent', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const { result } = renderHook(() => useShareProperty(7, 'بيت', 'بيتونيا', 'رام الله'), {
    wrapper: ToastProvider,
  })
  await act(() => result.current())
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/properties/7`)
  expect(screen.getByText('تم نسخ الرابط')).toBeTruthy()
})
it('does not report native share cancellation as an error', async () => {
  vi.stubGlobal('navigator', {
    share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
  })
  const { result } = renderHook(() => useShareProperty(7, 'بيت', 'بيتونيا', 'رام الله'), {
    wrapper: ToastProvider,
  })
  await act(() => result.current())
  expect(screen.queryByText('تعذر نسخ الرابط')).toBeNull()
})
it('reports copy failures', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  })
  const { result } = renderHook(() => useShareProperty(7, 'بيت', 'بيتونيا', 'رام الله'), {
    wrapper: ToastProvider,
  })
  await act(() => result.current())
  expect(screen.getByText('تعذر نسخ الرابط')).toBeTruthy()
})

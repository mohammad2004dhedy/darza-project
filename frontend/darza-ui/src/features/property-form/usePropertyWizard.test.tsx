// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePropertyWizard } from './usePropertyWizard'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  create: vi.fn(),
  upload: vi.fn(),
  items: [] as { id: string; kind: 'new'; blob: Blob; status: string }[],
}))
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../../context/auth', () => ({ useAuth: () => ({ userId: 7 }) }))
vi.mock('../../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('./api', () => ({ createProperty: mocks.create }))
vi.mock('./useImageUploader', () => ({
  useImageUploader: () => ({ items: mocks.items, isProcessing: false, uploadAll: mocks.upload }),
}))
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(() => usePropertyWizard(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  mocks.items = [{ id: 'one', kind: 'new', blob: new Blob(), status: 'ready' }]
  mocks.upload.mockResolvedValue(['properties/7/one.webp'])
  mocks.create.mockResolvedValue({ id: 12, postingStatus: 'PENDING' })
})
describe('create wizard', () => {
  it('validates only the current step and Back preserves values', async () => {
    const { result } = setup()
    await act(async () => result.current.next())
    expect(result.current.step).toBe(0)
    await act(async () => {
      result.current.form.setValue('propertyType', 'HOUSE')
      result.current.form.setValue('listingType', 'SELL')
    })
    await act(async () => result.current.next())
    expect(result.current.step).toBe(1)
    act(() => result.current.back())
    expect(result.current.form.getValues('propertyType')).toBe('HOUSE')
  })
  it('resets scroll without animation when changing steps', () => {
    const { result } = setup()
    vi.mocked(window.scrollTo).mockClear()
    act(() => result.current.setStep(5))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })
  it('forces LAND to SELL synchronously and permits RENT after leaving LAND', () => {
    const { result } = setup()
    act(() => {
      result.current.form.setValue('listingType', 'RENT')
      result.current.form.setValue('propertyType', 'LAND')
    })
    expect(result.current.form.getValues('listingType')).toBe('SELL')
    act(() => {
      result.current.form.setValue('propertyType', 'HOUSE')
      result.current.form.setValue('listingType', 'RENT')
    })
    expect(result.current.form.getValues('listingType')).toBe('RENT')
  })
  it('normalizes displayed Arabic and Persian digits including decimal separator', async () => {
    const { result } = setup()
    const target = { name: 'price', value: '١۲٫٥' }
    await act(async () => result.current.registerNumber('price').onChange({ target } as never))
    expect(target.value).toBe('12.5')
    expect(result.current.form.getValues('price')).toBe('12.5')
  })
  it('resets town after a city change', () => {
    const { result } = setup()
    act(() => {
      result.current.form.setValue('townId', '2')
      result.current.form.setValue('cityId', '3')
    })
    expect(result.current.form.getValues('townId')).toBe('')
  })
  it('blocks beforeunload for unsaved images and removes its listener on unmount', () => {
    const { unmount } = setup()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    unmount()
    const after = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
  })
  it('rounds geolocation, clears it, and shows permission errors', () => {
    const get = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: get },
    })
    const { result } = setup()
    act(() => result.current.locate())
    act(() => get.mock.calls[0][0]({ coords: { latitude: 31.123456789, longitude: 35.987654321 } }))
    expect(result.current.form.getValues('latitude')).toBe('31.123457')
    expect(result.current.form.getValues('longitude')).toBe('35.987654')
    act(() => result.current.clearLocation())
    expect(result.current.form.getValues('latitude')).toBe('')
    act(() => result.current.locate())
    act(() => get.mock.calls[1][1]({ code: 1 }))
    expect(result.current.locationError).toContain('رفض')
  })
})

// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePropertyWizard } from './usePropertyWizard'
import type { UploadImage } from './useImageUploader'
import type { PropertyDetailsResponse } from '../../types/api'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  items: [] as UploadImage[],
}))
import { MemoryRouter } from 'react-router'
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mocks.navigate,
}))
vi.mock('../../context/auth', () => ({ useAuth: () => ({ userId: 7 }) }))
vi.mock('../../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('./api', () => ({ createProperty: mocks.create, updateProperty: mocks.update }))
vi.mock('./useImageUploader', () => ({
  useImageUploader: () => ({ items: mocks.items, isProcessing: false, uploadAll: mocks.upload }),
}))
function setup(property?: PropertyDetailsResponse) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(() => usePropertyWizard(property), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  })
}
afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  mocks.items = [{ id: 'one', kind: 'new', url: 'blob:one', blob: new Blob(), status: 'ready' }]
  mocks.upload.mockResolvedValue(['properties/7/one.webp'])
  mocks.create.mockResolvedValue({ id: 12, postingStatus: 'PENDING' })
})
describe('create wizard', () => {
  it('treats implicit form submission before review as Next, not publish', async () => {
    const { result } = setup()
    await act(async () => {
      result.current.form.setValue('propertyType', 'HOUSE')
      result.current.form.setValue('listingType', 'SELL')
    })
    const preventDefault = vi.fn()
    await act(async () => {
      await result.current.onSubmit({ preventDefault } as never)
    })
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(result.current.step).toBe(1)
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })
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
    act(() => {
      result.current.form.setValue('propertyType', 'HOUSE')
      result.current.form.setValue('listingType', 'SELL')
    })
    act(() => result.current.setStep(1))
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
  it('does not block beforeunload in create mode because drafts cover edits', () => {
    const { unmount } = setup()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
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
    expect(result.current.locationError).toBe('لم يتم السماح بالوصول للموقع، فعّل الإذن من إعدادات المتصفح')
  })
  it('requests fresh high accuracy only on click, clears errors and ignores stale results', () => {
    const get = vi.fn()
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: get } })
    const { result } = setup()
    expect(get).not.toHaveBeenCalled()
    expect(result.current.locationState.status).toBe('idle')
    act(() => result.current.locate())
    expect(get.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
    expect(result.current.locationState.status).toBe('loading')
    act(() => get.mock.calls[0][1]({ code: 2 }))
    expect(result.current.locationError).toContain('تعذّر تحديد الموقع الحالي')
    act(() => result.current.locate())
    expect(result.current.locationError).toBeNull()
    act(() => get.mock.calls[1][1]({ code: 3 }))
    expect(result.current.locationError).toContain('انتهت مهلة')
    act(() => result.current.locate())
    act(() => get.mock.calls[2][0]({ coords: { latitude: 31.9, longitude: 35.2, accuracy: 1500 } }))
    expect(result.current.locationState).toEqual({ status: 'success', accuracy: 1500 })
    expect(result.current.locationError).toBeNull()
    expect(result.current.form.getValues('latitude')).toBe('31.900000')
    act(() => result.current.locate())
    act(() => result.current.chooseLocation(32.12345678, 35.12345678))
    act(() => get.mock.calls[3][0]({ coords: { latitude: 1, longitude: 2 } }))
    expect(result.current.form.getValues('latitude')).toBe('32.123457')
    expect(result.current.form.getValues('longitude')).toBe('35.123457')
    act(() => result.current.clearLocation())
    expect(result.current.locationState.status).toBe('idle')
    expect(result.current.form.getValues('longitude')).toBe('')
  })

})

describe('edit image change tracking', () => {
  it('detects image order, removals and additions, and becomes clean when the original list is restored', () => {
    const property: PropertyDetailsResponse = {
      id: 9, title: 'إعلان موجود', propertyType: 'HOUSE', listingType: 'SELL',
      price: 100, currency: 'ILS', isAvailable: true,
      town: { cityId: 1, cityName: 'مدينة', townId: 2, townName: 'بلدة' },
      user: { id: 7, displayName: 'مالك' },
      images: [{ path: 'properties/7/a.webp', url: 'a' }, { path: 'properties/7/b.webp', url: 'b' }],
    }
    const original: UploadImage[] = property.images.map((image) => ({
      id: image.path, kind: 'existing', path: image.path, url: image.url, status: 'done',
    }))
    mocks.items = original
    const { result, rerender } = setup(property)
    expect(result.current.unsaved).toBe(false)
    mocks.items = [...original].reverse()
    rerender()
    expect(result.current.unsaved).toBe(true)
    mocks.items = original
    rerender()
    expect(result.current.unsaved).toBe(false)
    mocks.items = original.slice(0, 1)
    rerender()
    expect(result.current.unsaved).toBe(true)
    mocks.items = [...original, { id: 'new', kind: 'new', url: 'blob:new', blob: new Blob(), status: 'ready' }]
    rerender()
    expect(result.current.unsaved).toBe(true)
    mocks.items = original
    rerender()
    expect(result.current.unsaved).toBe(false)
  })
})

// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { PropertyDetailsResponse } from '../../types/api'
import { ApiError } from '../../api/client'
import * as api from './api'
import { usePropertyWizard } from './usePropertyWizard'
import { PropertyWizard } from './components/PropertyWizard'
import { locationApi } from '../../api/locationApi'

const { navigate, toast } = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }))
import { MemoryRouter } from 'react-router'
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}))
vi.mock('../../context/auth', () => ({
  useAuth: () => ({ userId: 7, isAuthenticated: true, isAdmin: false, role: 'PUBLISHER' }),
}))
vi.mock('../../components/ui/useToast', () => ({ useToast: () => ({ showToast: toast }) }))
vi.mock('./imageCompress', () => ({
  compressImage: vi.fn(async () => new Blob(['webp'], { type: 'image/webp' })),
}))

beforeEach(() => {
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:${crypto.randomUUID()}`),
      revokeObjectURL: vi.fn(),
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const property = {
  id: 9,
  title: 'إعلان موجود',
  description: 'وصف',
  propertyType: 'HOUSE',
  listingType: 'RENT',
  price: 350,
  currency: 'ILS',
  rentPeriod: 'MONTHLY',
  rooms: 0,
  furnished: false,
  town: { cityId: 1, cityName: 'رام الله', townId: 2, townName: 'بيتونيا' },
  address: 'شارع تجريبي',
  latitude: 31.123456,
  longitude: 35.123456,
  user: { id: 7, displayName: 'مالك' },
  isAvailable: true,
  postingStatus: 'APPROVED',
  images: [
    { path: 'properties/7/a.webp', url: 'https://storage.example/a' },
    { path: 'properties/7/b.webp', url: 'https://storage.example/b' },
  ],
} satisfies PropertyDetailsResponse
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(({ data }) => usePropertyWizard(data), {
    initialProps: { data: property },
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  })
}
it('initializes all fields and existing images once, without marking an untouched edit dirty', () => {
  const { result, rerender } = setup()
  expect(result.current.form.getValues()).toMatchObject({
    title: property.title,
    cityId: '1',
    townId: '2',
    rooms: '0',
    furnished: 'false',
    latitude: '31.123456',
    longitude: '35.123456',
    imagePaths: property.images.map((i) => i.path),
  })
  expect(result.current.uploader.items.map((i) => i.path)).toEqual(
    property.images.map((i) => i.path),
  )
  expect(result.current.form.formState.isDirty).toBe(false)
  expect(result.current.unsaved).toBe(false)
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  act(() => result.current.form.setValue('title', 'تحرير محلي', { shouldDirty: true }))
  rerender({ data: { ...property, title: 'بيانات أحدث' } })
  expect(result.current.form.getValues('title')).toBe('تحرير محلي')
})
it('requires confirmation, cancellation sends nothing, and existing images never upload', async () => {
  const update = vi
    .spyOn(api, 'updateProperty')
    .mockResolvedValue({ ...property, postingStatus: 'PENDING' })
  const get = vi.spyOn(api, 'getUploadUrls')
  const upload = vi.spyOn(api, 'uploadToSignedUrl')
  const { result } = setup()
  act(() => result.current.form.setValue('title', 'إعلان معدل'))
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.confirming).toBe(true)
  expect(update).not.toHaveBeenCalled()
  act(() => result.current.cancelConfirmation())
  expect(result.current.confirming).toBe(false)
  await act(async () => {
    await result.current.onSubmit()
    await result.current.confirm()
  })
  expect(update).toHaveBeenCalledWith(
    9,
    expect.objectContaining({
      imagePaths: property.images.map((i) => i.path),
      townId: 2,
      latitude: 31.123456,
      longitude: 35.123456,
      rooms: 0,
      furnished: false,
    }),
  )
  expect(get).not.toHaveBeenCalled()
  expect(upload).not.toHaveBeenCalled()
  toast.mockClear()
  await act(async () => {
    await result.current.submit()
    await result.current.confirm()
  })
  expect(update).toHaveBeenCalledTimes(1)
  expect(toast).not.toHaveBeenCalled()
  expect(result.current.form.formState.isDirty).toBe(false)
  expect(result.current.unsaved).toBe(false)
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
})
it('removes existing images locally and uploads only new images, keeping payload order on PUT retry', async () => {
  const get = vi.spyOn(api, 'getUploadUrls').mockResolvedValue({
    uploadUrls: ['https://storage.example/new'],
    imagePaths: ['properties/7/new.webp'],
  })
  const upload = vi.spyOn(api, 'uploadToSignedUrl').mockResolvedValue()
  const update = vi
    .spyOn(api, 'updateProperty')
    .mockRejectedValueOnce(new ApiError(500, 'تعذر الحفظ'))
    .mockResolvedValueOnce(property)
  const { result } = setup()
  act(() => result.current.uploader.removeImage(result.current.uploader.items[0].id))
  await act(async () => {
    await result.current.uploader.addFiles([new File(['png'], 'new.png', { type: 'image/png' })])
  })
  expect(result.current.uploader.items.map((i) => i.kind)).toEqual(['existing', 'new'])
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  await act(async () => {
    await result.current.confirm()
  })
  expect(result.current.formError).toBe('تعذر الحفظ')
  await act(async () => {
    await result.current.confirm()
  })
  expect(get).toHaveBeenCalledExactlyOnceWith(1)
  expect(upload).toHaveBeenCalledOnce()
  expect(update).toHaveBeenCalledTimes(2)
  expect(update.mock.calls[1][1].imagePaths).toEqual([
    'properties/7/b.webp',
    'properties/7/new.webp',
  ])
})
it('allows clearing both coordinates and omits them rather than sending null', async () => {
  const update = vi.spyOn(api, 'updateProperty').mockResolvedValue(property)
  const { result } = setup()
  act(() => result.current.clearLocation())
  await act(async () => {
    await result.current.confirm()
  })
  expect(update.mock.calls[0][1]).not.toHaveProperty('latitude')
  expect(update.mock.calls[0][1]).not.toHaveProperty('longitude')
})
it('does not confirm or send a form with no remaining images', async () => {
  const update = vi.spyOn(api, 'updateProperty')
  const { result } = setup()
  act(() => {
    for (const item of result.current.uploader.items) result.current.uploader.removeImage(item.id)
  })
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.confirming).toBe(false)
  expect(result.current.step).toBe(4)
  expect(update).not.toHaveBeenCalled()
})

it('warns on unload only while edit values differ but always allows wizard Back', async () => {
  const { result } = setup()
  await act(async () => result.current.setStep(5))
  act(() => result.current.form.setValue('title', ''))
  const dirty = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(dirty)
  expect(dirty.defaultPrevented).toBe(true)
  act(() => result.current.back())
  expect(result.current.step).toBe(4)
  expect(result.current.form.getValues('title')).toBe('')
  expect(result.current.confirmingBack).toBe(false)
  act(() => result.current.form.setValue('title', property.title))
  const clean = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(clean)
  expect(clean.defaultPrevented).toBe(false)
  act(() => result.current.back())
  expect(result.current.confirmingBack).toBe(false)
})

it('ignores untouched edit submissions without a request, confirmation or toast', async () => {
  const update = vi.spyOn(api, 'updateProperty')
  const upload = vi.spyOn(api, 'getUploadUrls')
  const { result } = setup()
  expect(result.current.unsaved).toBe(false)
  await act(async () => {
    await result.current.submit()
    await result.current.confirm()
  })
  expect(result.current.unsaved).toBe(false)
  expect(result.current.confirming).toBe(false)
  expect(update).not.toHaveBeenCalled()
  expect(upload).not.toHaveBeenCalled()
  expect(toast).not.toHaveBeenCalled()
  expect(navigate).not.toHaveBeenCalled()
})
it('tracks coordinate changes and reversion against the loaded property', () => {
  const { result } = setup()
  act(() => result.current.form.setValue('latitude', '32.123456'))
  expect(result.current.unsaved).toBe(true)
  act(() => result.current.form.setValue('latitude', String(property.latitude)))
  expect(result.current.unsaved).toBe(false)
  act(() => result.current.form.setValue('longitude', '36.123456'))
  expect(result.current.unsaved).toBe(true)
  act(() => result.current.form.setValue('longitude', String(property.longitude)))
  expect(result.current.unsaved).toBe(false)
  act(() => result.current.clearLocation())
  expect(result.current.unsaved).toBe(true)
})
function EditWizard() {
  return <PropertyWizard wizard={usePropertyWizard(property)} />
}
function renderWizard(step: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/?step=${step}`]}>
        <EditWizard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}
it('preselects edit location after city and town options arrive separately', async () => {
  let resolveCities!: (items: { id: number; name: string }[]) => void
  let resolveTowns!: (items: { id: number; name: string }[]) => void
  vi.spyOn(locationApi, 'getCities').mockReturnValue(
    new Promise((resolve) => {
      resolveCities = resolve
    }),
  )
  const towns = vi.spyOn(locationApi, 'getTowns').mockReturnValue(
    new Promise((resolve) => {
      resolveTowns = resolve
    }),
  )
  const client = renderWizard(4)
  const city = screen.getByRole('combobox', { name: /المدينة/ }) as HTMLSelectElement
  const town = screen.getByRole('combobox', { name: /البلدة/ }) as HTMLSelectElement
  expect(city.disabled).toBe(true)
  expect(town.disabled).toBe(true)
  await act(async () => {
    resolveCities([{ id: 1, name: 'رام الله' }])
  })
  await waitFor(() => expect(city.value).toBe('1'))
  expect(towns).toHaveBeenCalledWith(1)
  expect(town.disabled).toBe(true)
  await act(async () => {
    resolveTowns([{ id: 2, name: 'بيتونيا' }])
  })
  await waitFor(() => expect(town.value).toBe('2'))
  expect(city.selectedOptions[0].textContent).toBe('رام الله')
  expect(town.selectedOptions[0].textContent).toBe('بيتونيا')
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await waitFor(() => expect(screen.queryByRole('combobox', { name: /البلدة/ })).toBeNull())
  client.clear()
})
it('disables property edit save until a change exists and disables it again after reversion', async () => {
  vi.spyOn(locationApi, 'getCities').mockResolvedValue([{ id: 1, name: 'رام الله' }])
  vi.spyOn(locationApi, 'getTowns').mockResolvedValue([{ id: 2, name: 'بيتونيا' }])
  const client = renderWizard(7)
  const save = screen.getByRole('button', { name: 'حفظ التعديلات' }) as HTMLButtonElement
  expect(save.disabled).toBe(true)
  expect(screen.getByText('لا توجد تغييرات للحفظ')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'تعديل العنوان والوصف' }))
  const title = await screen.findByRole('textbox', { name: /عنوان/ })
  fireEvent.change(title, { target: { value: 'إعلان معدل' } })
  fireEvent.click(screen.getByRole('button', { name: 'حفظ والعودة للمراجعة' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'حفظ التعديلات' }).hasAttribute('disabled')).toBe(
      false,
    ),
  )
  fireEvent.click(screen.getByRole('button', { name: 'تعديل العنوان والوصف' }))
  fireEvent.change(await screen.findByRole('textbox', { name: /عنوان/ }), {
    target: { value: property.title },
  })
  fireEvent.click(screen.getByRole('button', { name: 'حفظ والعودة للمراجعة' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'حفظ التعديلات' }).hasAttribute('disabled')).toBe(
      true,
    ),
  )
  client.clear()
})


it.each([false, true])('edit Next blocks a cleared title and completion updates immediately (review=%s)', async (fromReview) => {
  const { result } = setup()
  if (fromReview) {
    await act(async () => result.current.setStep(6))
    await act(async () => result.current.editStep(5))
  } else {
    await act(async () => result.current.setStep(5))
  }
  expect(result.current.returningToReview).toBe(fromReview)
  act(() => result.current.form.setValue('title', 'عنوان جديد'))
  expect(result.current.completed[5]).toBe(true)
  act(() => result.current.form.setValue('title', ''))
  expect(result.current.completed[5]).toBe(false)
  expect(result.current.completed[6]).toBe(false)
  await act(async () => result.current.next())
  expect(result.current.step).toBe(5)
  expect(result.current.form.getFieldState('title').error?.message).toBe('أدخل عنوان الإعلان')
  act(() => result.current.form.setValue('title', 'عنوان مصحح'))
  expect(result.current.completed[5]).toBe(true)
  expect(result.current.completed[6]).toBe(fromReview)
  await act(async () => result.current.next())
  expect(result.current.step).toBe(6)
})

it('updates the title station warning live when a populated title is cleared and fixed', async () => {
  renderWizard(6)
  const title = screen.getByRole('textbox', { name: /عنوان الإعلان/ })
  const station = screen.getByRole('button', { name: 'العنوان والوصف' })
  fireEvent.change(title, { target: { value: 'عنوان جديد' } })
  expect(station.querySelector('[aria-label="خطوة غير مكتملة"]')).toBeNull()
  fireEvent.change(title, { target: { value: '' } })
  expect(station.querySelector('[aria-label="خطوة غير مكتملة"]')).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await waitFor(() => expect(document.activeElement).toBe(title))
  expect(station.getAttribute('aria-current')).toBe('step')
  fireEvent.change(title, { target: { value: 'عنوان مصحح' } })
  expect(station.querySelector('[aria-label="خطوة غير مكتملة"]')).toBeNull()
})

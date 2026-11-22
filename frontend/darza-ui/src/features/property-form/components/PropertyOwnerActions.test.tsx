// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/client'
import type { PropertyDetailsResponse } from '../../../types/api'
import * as api from '../api'
import { PropertyOwnerActions } from './PropertyOwnerActions'

const mocks = vi.hoisted(() => ({
  auth: { userId: 7 as number | null, isAdmin: false, role: 'USER' },
  navigate: vi.fn(),
  showToast: vi.fn(),
}))
vi.mock('../../../context/auth', () => ({ useAuth: () => mocks.auth }))
vi.mock('../../../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mocks.navigate,
}))

const property: PropertyDetailsResponse = {
  id: 23,
  title: 'Owner property',
  propertyType: 'APARTMENT',
  listingType: 'SELL',
  postingStatus: 'APPROVED',
  price: 100000,
  currency: 'USD',
  town: { townId: 3, townName: 'Town', cityId: 2, cityName: 'City' },
  isAvailable: true,
  user: { id: 7, displayName: 'Owner' },
  images: [],
}
const keys = [
  ['properties'],
  ['properties', 'details', '23'],
  ['users', 'me', 'properties'],
  ['users', 7, 'properties'],
]
const clients: QueryClient[] = []
function setup(overrides: Partial<PropertyDetailsResponse> = {}, compact = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  keys.forEach((key) => client.setQueryData(key, property))
  client.setQueryData(['unrelated'], 'preserve')
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PropertyOwnerActions compact={compact} property={{ ...property, ...overrides }} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}

const actions = [
  { kind: 'availability', open: 'تمييز كغير متاح', confirm: 'تأكيد' },
  { kind: 'delete', open: 'حذف الإعلان', confirm: 'حذف نهائياً' },
] as const

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth = { userId: 7, isAdmin: false, role: 'USER' }
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.restoreAllMocks()
})

it('shows owner controls and the edit link for the current property', () => {
  setup()
  expect(screen.getByRole('region', { name: 'إدارة الإعلان' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'تعديل الإعلان' }).getAttribute('href')).toBe(
    '/properties/23/edit',
  )
  expect(screen.getByRole('button', { name: 'تمييز كغير متاح' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'حذف الإعلان' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
})

it.each([
  { userId: 8, isAdmin: false, role: 'USER' },
  { userId: 8, isAdmin: true, role: 'ADMIN' },
  { userId: null, isAdmin: false, role: 'USER' },
])('hides all controls from a nonowner, including admin: $isAdmin, user: $userId', (auth) => {
  mocks.auth = auth
  setup()
  expect(screen.queryByRole('region')).toBeNull()
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.queryByRole('button')).toBeNull()
})

it.each(['PENDING', 'REJECTED'] as const)(
  'hides availability for %s but retains edit and delete',
  (postingStatus) => {
    setup({ postingStatus })
    expect(screen.queryByRole('button', { name: /تمييز/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'تعديل الإعلان' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'حذف الإعلان' })).toBeTruthy()
  },
)

it('supports availability when the legacy response omits posting status', () => {
  setup({ postingStatus: undefined })
  expect(screen.getByRole('button', { name: 'تمييز كغير متاح' })).toBeTruthy()
})

it('offers marking an unavailable approved property as available', () => {
  setup({ isAvailable: false })
  fireEvent.click(screen.getByRole('button', { name: 'تمييز كمتاح' }))
  expect(screen.getByRole('dialog', { name: 'تمييز كمتاح' })).toBeTruthy()
})

it.each(actions)('cancels $kind without making requests or invalidating cache', ({ open }) => {
  const patch = vi.spyOn(api, 'setAvailability')
  const remove = vi.spyOn(api, 'deleteProperty')
  const client = setup()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  fireEvent.click(screen.getByRole('button', { name: open }))
  const dialog = screen.getByRole('dialog')
  expect(patch).not.toHaveBeenCalled()
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(within(dialog).getByRole('button', { name: 'إلغاء' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(patch).not.toHaveBeenCalled()
  expect(remove).not.toHaveBeenCalled()
  expect(invalidate).not.toHaveBeenCalled()
  expect(mocks.navigate).not.toHaveBeenCalled()
})

it('handles native dialog cancellation without deleting', () => {
  const request = vi.spyOn(api, 'deleteProperty')
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الإعلان' }))
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(request).not.toHaveBeenCalled()
})

it.each(actions)(
  'confirms $kind once, blocks duplicate calls and cancellation while busy',
  async ({ kind, open, confirm }) => {
    let resolve!: () => void
    const pending = new Promise<void>((done) => {
      resolve = done
    })
    const patch = vi.spyOn(api, 'setAvailability').mockImplementation(async () => {
      await pending
      return undefined
    })
    const remove = vi.spyOn(api, 'deleteProperty').mockReturnValue(pending)
    setup()
    fireEvent.click(screen.getByRole('button', { name: open }))
    const dialog = screen.getByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', { name: confirm }) as HTMLButtonElement
    const cancelButton = within(dialog).getByRole('button', { name: 'إلغاء' }) as HTMLButtonElement
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)
    expect(confirmButton.disabled).toBe(true)
    expect(cancelButton.disabled).toBe(true)
    expect(dialog.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(cancelButton)
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(
      (screen.getByRole('button', { name: 'حذف الإعلان' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect((screen.getByRole('button', { name: open }) as HTMLButtonElement).disabled).toBe(true)
    expect(kind === 'availability' ? patch : remove).toHaveBeenCalledExactlyOnceWith(23)
    expect(kind === 'availability' ? remove : patch).not.toHaveBeenCalled()
    await act(async () => resolve())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  },
)

it('invalidates all property feeds and details after a successful availability PATCH', async () => {
  const request = vi.spyOn(api, 'setAvailability').mockResolvedValue(undefined)
  const client = setup()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  fireEvent.click(screen.getByRole('button', { name: 'تمييز كغير متاح' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأكيد' }))
  await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('تم تحديث حالة التوفر'))
  expect(request).toHaveBeenCalledExactlyOnceWith(23)
  expect(invalidate.mock.calls).toEqual([
    [{ queryKey: ['properties'] }],
    [{ queryKey: ['users', 'me', 'properties'] }],
    [{ queryKey: ['users', 7, 'properties'] }],
  ])
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true))
  expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
  expect(mocks.navigate).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('removes only deleted details, invalidates feeds and navigates to the profile', async () => {
  const request = vi.spyOn(api, 'deleteProperty').mockResolvedValue(undefined)
  const client = setup()
  client.setQueryData(['properties', 'details', '24'], { ...property, id: 24 })
  const remove = vi.spyOn(client, 'removeQueries')
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  fireEvent.click(screen.getByRole('button', { name: 'حذف الإعلان' }))
  expect(screen.getByText('سيتم حذف الإعلان نهائياً. لا يمكن التراجع عن هذا الإجراء.')).toBeTruthy()
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'حذف نهائياً' }))
  await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('تم حذف الإعلان'))
  expect(request).toHaveBeenCalledExactlyOnceWith(23)
  expect(remove).toHaveBeenCalledExactlyOnceWith({
    queryKey: ['properties', 'details', '23'],
    exact: true,
  })
  expect(client.getQueryData(['properties', 'details', '23'])).toBeUndefined()
  expect(client.getQueryData(['properties', 'details', '24'])).toBeTruthy()
  expect(invalidate.mock.calls).toEqual([
    [{ queryKey: ['properties'] }],
    [{ queryKey: ['users', 'me', 'properties'] }],
    [{ queryKey: ['users', 7, 'properties'] }],
  ])
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/profile', { replace: true })
  expect(screen.queryByRole('dialog')).toBeNull()
})

it.each(actions)(
  'shows a $kind API error and allows retry without premature success effects',
  async ({ kind, open, confirm }) => {
    const patch = vi
      .spyOn(api, 'setAvailability')
      .mockRejectedValueOnce(new ApiError(500, 'Server refused action'))
      .mockResolvedValueOnce(undefined)
    const remove = vi
      .spyOn(api, 'deleteProperty')
      .mockRejectedValueOnce(new ApiError(500, 'Server refused action'))
      .mockResolvedValueOnce(undefined)
    const client = setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    fireEvent.click(screen.getByRole('button', { name: open }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: confirm }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Server refused action')
    expect(invalidate).not.toHaveBeenCalled()
    expect(mocks.showToast).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
    expect(client.getQueryData(['properties', 'details', '23'])).toEqual(property)
    const button = within(screen.getByRole('dialog')).getByRole('button', {
      name: confirm,
    }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledTimes(1))
    expect(kind === 'availability' ? patch : remove).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  },
)

it('shows a fallback error and clears it when reopening the confirmation', async () => {
  vi.spyOn(api, 'deleteProperty').mockRejectedValue(new Error('network failure'))
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الإعلان' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'حذف نهائياً' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'تعذر تنفيذ الإجراء، حاول مرة أخرى',
  )
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'إلغاء' }))
  fireEvent.click(screen.getByRole('button', { name: 'حذف الإعلان' }))
  expect(screen.queryByRole('alert')).toBeNull()
})

it('keeps compact actions on the profile after confirmed deletion', async () => {
  vi.spyOn(api, 'deleteProperty').mockResolvedValue()
  setup({}, true)
  expect(screen.queryByRole('heading', { name: 'إدارة إعلانك' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الإعلان' }))
  fireEvent.click(screen.getByRole('button', { name: 'حذف نهائياً' }))
  await waitFor(() => expect(api.deleteProperty).toHaveBeenCalledWith(23))
  await waitFor(() => expect(mocks.showToast).toHaveBeenCalled())
  expect(mocks.navigate).not.toHaveBeenCalled()
})

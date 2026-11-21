// @vitest-environment jsdom
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as api from '../features/properties/api'
import type { usePropertyWizard } from '../features/property-form/usePropertyWizard'
import type { PropertyDetailsResponse } from '../types/api'
import EditPropertyPage from './EditPropertyPage'

const mocks = vi.hoisted(() => ({
  auth: { userId: 7 as number | null, isAdmin: false, role: 'USER' },
  showToast: vi.fn(),
}))
vi.mock('../context/auth', () => ({ useAuth: () => mocks.auth }))
vi.mock('../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('../features/property-form/components/PropertyWizard', () => ({
  PropertyWizard: ({ wizard }: { wizard: ReturnType<typeof usePropertyWizard> }) => (
    <form aria-label="Edit property">
      <input aria-label="Title" {...wizard.form.register('title')} />
      <output aria-label="Dirty">{String(wizard.form.formState.isDirty)}</output>
    </form>
  ),
}))

const property: PropertyDetailsResponse = {
  id: 7,
  title: 'Fresh property title',
  propertyType: 'APARTMENT',
  listingType: 'SELL',
  price: 100000,
  currency: 'USD',
  town: { townId: 3, townName: 'Town', cityId: 2, cityName: 'City' },
  isAvailable: true,
  user: { id: 7, displayName: 'Owner' },
  images: [],
}
const queryKey = ['properties', 'details', '7']
const clients: QueryClient[] = []

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  clients.push(client)
  return client
}

function renderPage(id = '7', client = createClient()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/properties/${id}/edit`]}>
        <Routes>
          <Route path="/properties/:id/edit" element={<EditPropertyPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mocks.auth = { userId: 7, isAdmin: false, role: 'USER' }
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
  vi.restoreAllMocks()
})

it('requests fresh details even with a fresh cache and hides the form until they arrive', async () => {
  let resolve!: (value: PropertyDetailsResponse) => void
  const request = vi.spyOn(api, 'getPropertyDetails').mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const client = createClient()
  client.setQueryData(queryKey, { ...property, title: 'Cached title' })
  renderPage('7', client)

  expect(request).toHaveBeenCalledExactlyOnceWith(7)
  expect(screen.getByRole('status', { name: 'جارٍ تحميل الإعلان' })).toBeTruthy()
  expect(screen.queryByRole('form')).toBeNull()
  await act(async () => resolve(property))
  await waitFor(() =>
    expect((screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement).value).toBe(
      property.title,
    ),
  )
  expect(screen.getByLabelText('Dirty').textContent).toBe('false')
})

it('loads and initializes the owner form without a cached details entry', async () => {
  vi.spyOn(api, 'getPropertyDetails').mockResolvedValue(property)
  renderPage()
  const input = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement
  expect(input.value).toBe(property.title)
  expect(screen.getByLabelText('Dirty').textContent).toBe('false')
})

it.each([
  { userId: 8, isAdmin: false, role: 'USER' },
  { userId: 8, isAdmin: true, role: 'ADMIN' },
  { userId: null, isAdmin: false, role: 'USER' },
])('denies a nonowner even when admin: $isAdmin, user: $userId', async (auth) => {
  mocks.auth = auth
  vi.spyOn(api, 'getPropertyDetails').mockResolvedValue(property)
  renderPage()
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'لا يمكنك تعديل إعلان لا تملكه',
  )
  expect(screen.queryByRole('form')).toBeNull()
})

it('checks ownership against the fresh response, not the cached owner', async () => {
  vi.spyOn(api, 'getPropertyDetails').mockResolvedValue({
    ...property,
    user: { id: 8, displayName: 'New owner' },
  })
  const client = createClient()
  client.setQueryData(queryKey, property)
  renderPage('7', client)
  expect(screen.queryByRole('form')).toBeNull()
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'لا يمكنك تعديل إعلان لا تملكه',
  )
  expect(screen.queryByRole('form')).toBeNull()
})

it.each(['0', '-1', 'abc', '1.5', '9007199254740992'])(
  'rejects invalid id %s without a request',
  (id) => {
    const request = vi.spyOn(api, 'getPropertyDetails')
    renderPage(id)
    expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()
    expect(request).not.toHaveBeenCalled()
    expect(screen.queryByRole('form')).toBeNull()
  },
)

it.each([400, 403, 404])('shows not found for %s without retry', async (status) => {
  const request = vi
    .spyOn(api, 'getPropertyDetails')
    .mockRejectedValue(new ApiError(status, 'missing'))
  renderPage()
  expect(await screen.findByText('الإعلان غير موجود')).toBeTruthy()
  expect(request).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('form')).toBeNull()
})

it('does not edit cached data on a server error and allows an explicit retry', async () => {
  const request = vi
    .spyOn(api, 'getPropertyDetails')
    .mockRejectedValueOnce(new ApiError(500, 'failed'))
    .mockResolvedValueOnce(property)
  const client = createClient()
  client.setQueryData(queryKey, { ...property, title: 'Cached title' })
  renderPage('7', client)
  const retry = await screen.findByRole('button', { name: 'حاول مرة أخرى' })
  expect(request).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('form')).toBeNull()
  fireEvent.click(retry)
  const input = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement
  expect(input.value).toBe(property.title)
  expect(request).toHaveBeenCalledTimes(2)
})

it('initializes only once and preserves dirty edits through a background refetch', async () => {
  const request = vi
    .spyOn(api, 'getPropertyDetails')
    .mockResolvedValueOnce(property)
    .mockResolvedValueOnce({ ...property, title: 'Background server title' })
  const client = createClient()
  renderPage('7', client)
  const input = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement
  fireEvent.change(input, { target: { value: 'My unsaved edits' } })
  expect(screen.getByLabelText('Dirty').textContent).toBe('true')

  await act(async () => {
    await client.refetchQueries({ queryKey })
  })
  await waitFor(() =>
    expect(client.getQueryData<PropertyDetailsResponse>(queryKey)?.title).toBe(
      'Background server title',
    ),
  )
  expect(request).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('textbox', { name: 'Title' })).toBe(input)
  expect(input.value).toBe('My unsaved edits')
  expect(screen.getByLabelText('Dirty').textContent).toBe('true')
})

it('does not refetch on focus or reconnect while editing', async () => {
  const request = vi.spyOn(api, 'getPropertyDetails').mockResolvedValue(property)
  renderPage()
  const input = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement
  fireEvent.change(input, { target: { value: 'Unsaved title' } })

  await act(async () => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  expect(request).toHaveBeenCalledTimes(1)
  expect(input.value).toBe('Unsaved title')
  expect(screen.getByLabelText('Dirty').textContent).toBe('true')
})

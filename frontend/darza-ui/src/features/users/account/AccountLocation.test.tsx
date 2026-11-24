// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { locationApi } from '../../../api/locationApi'
import { AccountForm } from './AccountForm'
vi.mock('../../../context/auth', () => ({ useAuth: () => ({}) }))
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../../../components/ui/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('../../../api/locationApi', () => ({
  locationApi: { getCities: vi.fn(), getTowns: vi.fn() },
}))
afterEach(cleanup)
it('selects the saved city and town when options load asynchronously and clears town on city change', async () => {
  let citiesReady!: (items: { id: number; name: string }[]) => void
  let townsReady!: (items: { id: number; name: string }[]) => void
  vi.mocked(locationApi.getCities).mockReturnValue(
    new Promise((resolve) => {
      citiesReady = resolve
    }),
  )
  vi.mocked(locationApi.getTowns)
    .mockReturnValueOnce(
      new Promise((resolve) => {
        townsReady = resolve
      }),
    )
    .mockResolvedValue([])
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AccountForm
        profile={{
          id: 7,
          displayName: 'اسم',
          email: 'test@example.com',
          phoneNumber: '+970590000000',
          createdAt: '',
          town: { cityId: 1, cityName: 'القدس', townId: 1, townName: 'البلدة القديمة' },
        }}
      />
    </QueryClientProvider>,
  )
  const city = screen.getByRole('combobox', { name: /المدينة/ }) as HTMLSelectElement
  const town = screen.getByRole('combobox', { name: /البلدة/ }) as HTMLSelectElement
  expect(city.disabled).toBe(true)
  expect(town.disabled).toBe(true)
  await act(async () => {
    citiesReady([
      { id: 1, name: 'القدس' },
      { id: 2, name: 'رام الله' },
    ])
  })
  await waitFor(() => expect(city.value).toBe('1'))
  expect(locationApi.getTowns).toHaveBeenCalledWith(1)
  expect(town.disabled).toBe(true)
  await act(async () => { townsReady([{ id: 1, name: 'البلدة القديمة' }]) })
  await waitFor(() => {
    expect(city.value).toBe('1')
    expect(town.value).toBe('1')
  })
  expect(city.selectedOptions[0].textContent).toBe('القدس')
  expect(town.selectedOptions[0].textContent).toBe('البلدة القديمة')
  fireEvent.change(city, { target: { value: '2' } })
  await waitFor(() => {
    expect(city.value).toBe('2')
    expect(town.value).toBe('')
  })
  client.clear()
})

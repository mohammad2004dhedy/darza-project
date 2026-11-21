// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { usePropertyWizard } from '../usePropertyWizard'
import { PropertyWizard } from './PropertyWizard'

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../../../context/auth', () => ({ useAuth: () => ({ userId: 7 }) }))
vi.mock('../../../components/ui/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('../../location/hooks', () => ({
  useCities: () => ({ data: [{ id: 1, name: 'رام الله' }], isPending: false }),
  useTowns: () => ({ data: [{ id: 2, name: 'البيرة' }], isPending: false }),
}))
afterEach(cleanup)

function setup() {
  function Wizard() {
    const wizard = usePropertyWizard()
    return <PropertyWizard wizard={wizard} />
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Wizard />
    </QueryClientProvider>,
  )
}
async function priceStep() {
  fireEvent.click(screen.getByRole('button', { name: 'شقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'للبيع' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText(/السعر/)
}

it('validates the first step and does not render submit before review', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByText('اختر نوع العقار')
  expect(screen.queryByRole('button', { name: 'إرسال الإعلان' })).toBeNull()
})

it('forces land to sale and re-enables rent when leaving land', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'للإيجار' }))
  fireEvent.click(screen.getByRole('button', { name: 'أرض' }))
  const rent = screen.getByRole('button', { name: 'للإيجار' }) as HTMLButtonElement
  expect(rent.disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'للبيع' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'شقة' }))
  expect(rent.disabled).toBe(false)
})

it('preserves values on Back and normalizes displayed Arabic/Persian numbers', async () => {
  setup()
  await priceStep()
  expect(screen.getByRole('button', { name: 'ILS' }).getAttribute('aria-pressed')).toBe('false')
  fireEvent.change(screen.getByLabelText(/السعر/), { target: { value: '١۲٣٫٤٥' } })
  expect((screen.getByLabelText(/السعر/) as HTMLInputElement).value).toBe('123.45')
  fireEvent.click(screen.getByRole('button', { name: 'USD' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText('المساحة (م²)')
  fireEvent.click(screen.getByRole('button', { name: 'السابق' }))
  await waitFor(() =>
    expect((screen.getByLabelText(/السعر/) as HTMLInputElement).value).toBe('123.45'),
  )
  expect(screen.getByRole('button', { name: 'USD' }).getAttribute('aria-pressed')).toBe('true')
})

it('requires rent period and shows only area for land', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'أرض' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText(/السعر/)
  expect(screen.queryByLabelText(/فترة الإيجار/)).toBeNull()
  fireEvent.change(screen.getByLabelText(/السعر/), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'ILS' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText('المساحة (م²)')
  expect(screen.queryByLabelText('عدد الغرف')).toBeNull()
  expect(screen.queryByLabelText('مفروش')).toBeNull()
})

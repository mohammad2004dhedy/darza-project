// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { usePropertyWizard } from '../usePropertyWizard'
import { PropertyWizard } from './PropertyWizard'

import { MemoryRouter } from 'react-router'
vi.mock('../../../context/auth', () => ({ useAuth: () => ({ userId: 7 }) }))
vi.mock('../../../components/ui/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('../../location/hooks', () => ({
  useCities: () => ({ data: [{ id: 1, name: 'رام الله' }], isPending: false }),
  useTowns: () => ({ data: [{ id: 2, name: 'البيرة' }], isPending: false }),
}))
afterEach(() => { cleanup(); localStorage.clear() })

let current: ReturnType<typeof usePropertyWizard>

function setup(review = false) {
  function Wizard() {
    const wizard = usePropertyWizard(review ? {
      id: 9, title: 'إعلان تجريبي', propertyType: 'HOUSE', listingType: 'SELL',
      price: 350, currency: 'ILS', isAvailable: true, postingStatus: 'APPROVED',
      town: { cityId: 1, cityName: 'رام الله', townId: 2, townName: 'البيرة' },
      user: { id: 7, displayName: 'مالك' },
      images: [{ path: 'properties/7/a.webp', url: '/a.webp' }],
    } : undefined)
    current = wizard
    return <PropertyWizard wizard={wizard} />
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Wizard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
async function priceStep() {
  fireEvent.click(screen.getByRole('button', { name: 'شقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'للبيع' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText(/السعر/, { selector: 'input' })
}

it('validates the first step and does not render submit before review', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByText('اختر نوع العقار')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'شقة' }))
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
  fireEvent.change(screen.getByLabelText(/السعر/, { selector: 'input' }), {
    target: { value: '١۲٣٫٤٥' },
  })
  expect((screen.getByLabelText(/السعر/, { selector: 'input' }) as HTMLInputElement).value).toBe(
    '123.45',
  )
  fireEvent.click(screen.getByRole('button', { name: 'USD' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText('المساحة (م²)')
  fireEvent.click(screen.getByRole('button', { name: 'السابق' }))
  await waitFor(() =>
    expect((screen.getByLabelText(/السعر/, { selector: 'input' }) as HTMLInputElement).value).toBe(
      '123.45',
    ),
  )
  expect(screen.getByRole('button', { name: 'USD' }).getAttribute('aria-pressed')).toBe('true')
})

it('shows only area for land', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'أرض' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText(/السعر/, { selector: 'input' })
  expect(screen.queryByLabelText(/فترة الإيجار/)).toBeNull()
  fireEvent.change(screen.getByLabelText(/السعر/, { selector: 'input' }), {
    target: { value: '0' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'ILS' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText('المساحة (م²)')
  expect(screen.queryByLabelText('عدد الغرف')).toBeNull()
  expect(screen.queryByLabelText('مفروش')).toBeNull()
})

it('requires rent period on the price step', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'شقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'للإيجار' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText(/السعر/, { selector: 'input' })
  fireEvent.change(screen.getByLabelText(/السعر/, { selector: 'input' }), {
    target: { value: '100' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'ILS' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByText('اختر فترة الإيجار', { selector: 'p' })
})

it('review includes named location and edit links for every section', async () => {
  setup(true)
  act(() => {
    current.form.setValue('cityId', '1')
    current.form.setValue('townId', '2')
  })
  await act(async () => current.editStep(6))
  expect(screen.getByText('رام الله، البيرة')).toBeTruthy()
  expect(screen.getAllByRole('button', { name: /^تعديل / })).toHaveLength(6)
  expect(screen.getByRole('button', { name: 'حفظ التعديلات' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'تعديل السعر' }))
  await screen.findByText('الخطوة 2 من 7')
})

it('uses rent-only native radio chips and preserves the selected period', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'شقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'للإيجار' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByRole('radiogroup', { name: 'فترة الإيجار' })
  expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
    'HOURLY',
    'DAILY',
    'MONTHLY',
    'YEARLY',
  ])
  fireEvent.click(screen.getByRole('radio', { name: 'شهري' }))
  expect(current.form.getValues('rentPeriod')).toBe('MONTHLY')
  expect((screen.getByRole('radio', { name: 'شهري' }) as HTMLInputElement).checked).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'السابق' }))
  fireEvent.click(screen.getByRole('button', { name: 'للبيع' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await waitFor(() => expect(screen.queryByRole('radiogroup')).toBeNull())
})

it('starts with an empty price, rejects it, and accepts an explicit zero', async () => {
  setup()
  await priceStep()
  expect((screen.getByRole('textbox', { name: /السعر/ }) as HTMLInputElement).value).toBe('')
  fireEvent.click(screen.getByRole('button', { name: 'ILS' }))
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await waitFor(() =>
    expect(current.form.formState.errors.price?.message).toMatch(/[\u0600-\u06ff]/),
  )
  fireEvent.change(screen.getByRole('textbox', { name: /السعر/ }), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
  await screen.findByLabelText('المساحة (م²)')
})

it('reviews only existing values, retains false and zero, and hides coordinate numbers', async () => {
  setup(true)
  act(() => {
    current.form.setValue('price', '0')
    current.form.setValue('currency', 'ILS')
    current.form.setValue('rooms', '0')
    current.form.setValue('furnished', 'false')
    current.form.setValue('latitude', '31.123456')
    current.form.setValue('longitude', '35.123456')
  })
  await act(async () => current.editStep(6))
  expect(screen.getByText('السعر عند التواصل')).toBeTruthy()
  expect(screen.getByText('تم تحديد الموقع على الخريطة')).toBeTruthy()
  expect(screen.getByText('الغرف')).toBeTruthy()
  expect(screen.getByText('لا', { selector: 'bdi' })).toBeTruthy()
  expect(screen.queryByText('الحمامات')).toBeNull()
  expect(screen.queryByText('غير محدد')).toBeNull()
  expect(screen.queryByText('لا يوجد وصف')).toBeNull()
  expect(screen.queryByText(/31\.123456/)).toBeNull()
  act(() => {
    current.form.setValue('price', '1250')
    current.form.setValue('latitude', '')
    current.form.setValue('longitude', '')
  })
  expect(screen.getByText('1,250 ₪')).toBeTruthy()
  expect(screen.queryByText('تم تحديد الموقع على الخريطة')).toBeNull()
})

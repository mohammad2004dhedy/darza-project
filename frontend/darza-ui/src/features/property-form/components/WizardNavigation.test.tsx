// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropertyDetailsResponse } from '../../../types/api'
import { usePropertyWizard } from '../usePropertyWizard'
import { PropertyWizard } from './PropertyWizard'

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  uploadAll: vi.fn(),
  items: [{ id: 'photo', kind: 'new', blob: new Blob(), status: 'ready' }],
}))
vi.mock('../../../context/auth', () => ({ useAuth: () => ({ userId: 7 }) }))
vi.mock('../../../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('../../location/hooks', () => ({
  useCities: () => ({ data: [{ id: 1, name: 'رام الله' }], isPending: false }),
  useTowns: () => ({ data: [{ id: 2, name: 'البيرة' }], isPending: false }),
}))
vi.mock('../useImageUploader', () => ({
  useImageUploader: () => ({
    items: mocks.items,
    isProcessing: false,
    uploadAll: mocks.uploadAll,
  }),
}))

const titles = [
  'نوع الإعلان والعقار',
  'السعر',
  'المواصفات',
  'الموقع',
  'الصور',
  'العنوان والوصف',
  'مراجعة الإعلان',
]
const property = {
  id: 9,
  title: 'إعلان موجود',
  propertyType: 'HOUSE',
  listingType: 'SELL',
  price: 350,
  currency: 'ILS',
  town: { cityId: 1, cityName: 'رام الله', townId: 2, townName: 'البيرة' },
  user: { id: 7, displayName: 'مالك' },
  isAvailable: true,
  postingStatus: 'APPROVED',
  images: [{ path: 'properties/7/a.webp', url: 'https://storage.example/a.webp' }],
} satisfies PropertyDetailsResponse

function HistoryControls() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="wizard-search">{location.search}</output>
      <button onClick={() => navigate(-1)}>History back</button>
      <button onClick={() => navigate(1)}>History forward</button>
    </>
  )
}

function setup({ edit = false, url = '/wizard' } = {}) {
  let current: ReturnType<typeof usePropertyWizard>
  function Harness() {
    const wizard = usePropertyWizard(edit ? property : undefined)
    useEffect(() => {
      current = wizard
    }, [wizard])
    return (
      <>
        <HistoryControls />
        <PropertyWizard wizard={wizard} />
      </>
    )
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return {
    get wizard() {
      return current
    },
  }
}

function stepButton(index: number) {
  return within(
    screen.getByRole('navigation', { name: 'خطوات الإعلان' }),
  ).getByRole<HTMLButtonElement>('button', { name: titles[index] })
}
function params() {
  return new URLSearchParams(screen.getByTestId('wizard-search').textContent ?? '')
}
async function expectStep(index: number) {
  await waitFor(() => {
    expect(stepButton(index).getAttribute('aria-current'), `station ${index}: ${params()}`).toBe(
      'step',
    )
    expect(params().get('step')).toBe(String(index + 1))
  })
}
async function fillRequired(state: ReturnType<typeof setup>) {
  await act(async () => {
    state.wizard.form.setValue('propertyType', 'HOUSE')
    state.wizard.form.setValue('listingType', 'SELL')
    state.wizard.form.setValue('price', '350')
    state.wizard.form.setValue('currency', 'ILS')
    state.wizard.form.setValue('cityId', '1')
    state.wizard.form.setValue('townId', '2')
    state.wizard.form.setValue('title', 'إعلان تجريبي')
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('create wizard navigation', () => {
  it('disables forward stations until their required predecessors are valid', async () => {
    const state = setup()
    await expectStep(0)
    for (let index = 1; index < 7; index++) expect(stepButton(index).disabled).toBe(true)
    await act(async () => state.wizard.setStep(3))
    await expectStep(0)

    await act(async () => {
      state.wizard.form.setValue('propertyType', 'HOUSE')
      state.wizard.form.setValue('listingType', 'SELL')
    })
    expect(stepButton(1).disabled).toBe(false)
    expect(stepButton(2).disabled).toBe(true)
    fireEvent.click(stepButton(1))
    await expectStep(1)
    await act(async () => {
      state.wizard.form.setValue('price', '350')
      state.wizard.form.setValue('currency', 'ILS')
    })
    expect(stepButton(3).disabled).toBe(false)
    expect(stepButton(4).disabled).toBe(true)
    fireEvent.click(stepButton(3))
    await expectStep(3)
  })

  it('blocks visited stations after an earlier required field becomes invalid', async () => {
    const state = setup()
    await fillRequired(state)
    fireEvent.click(stepButton(3))
    await expectStep(3)
    await act(async () => state.wizard.form.setValue('propertyType', ''))
    expect(stepButton(0).disabled).toBe(false)
    fireEvent.click(stepButton(0))
    await expectStep(0)
    expect(stepButton(3).disabled).toBe(true)
    fireEvent.click(stepButton(3))
    await expectStep(0)
  })

  it('requires all required fields for review even after review has been visited', async () => {
    const state = setup()
    await fillRequired(state)
    expect(stepButton(6).disabled).toBe(false)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(stepButton(5))
    await expectStep(5)
    fireEvent.change(screen.getByRole('textbox', { name: /عنوان الإعلان/ }), {
      target: { value: '' },
    })
    expect(stepButton(6).disabled).toBe(true)
    await act(async () => state.wizard.setStep(6))
    await expectStep(5)
  })

  it.each(['7', '4', '0', '8', 'invalid'])(
    'normalizes inaccessible create URL step=%s',
    async (step) => {
      setup({ url: `/wizard?step=${step}&source=profile` })
      await expectStep(0)
      expect(params().get('source')).toBe('profile')
    },
  )
})

describe('edit wizard navigation', () => {
  it('enables every station and preserves unsaved data across arbitrary jumps', async () => {
    const state = setup({ edit: true, url: '/wizard?step=6' })
    await expectStep(5)
    fireEvent.change(screen.getByRole('textbox', { name: /عنوان الإعلان/ }), {
      target: { value: 'عنوان معدل' },
    })
    await act(async () => state.wizard.form.setValue('price', ''))
    for (let index = 0; index < 7; index++) expect(stepButton(index).disabled).toBe(false)
    fireEvent.click(stepButton(0))
    await expectStep(0)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(stepButton(5))
    await expectStep(5)
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: /عنوان الإعلان/ }).value).toBe(
      'عنوان معدل',
    )
    expect(state.wizard.form.getValues('price')).toBe('')
    expect(state.wizard.uploader.items).toHaveLength(1)
  })

  it('honors a direct URL and browser back/forward while retaining unrelated query parameters', async () => {
    setup({ edit: true, url: '/wizard?step=5&source=profile' })
    await expectStep(4)
    fireEvent.click(stepButton(0))
    await expectStep(0)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(screen.getByRole('button', { name: 'History back' }))
    await expectStep(0)
    fireEvent.click(screen.getByRole('button', { name: 'History back' }))
    await expectStep(4)
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }))
    await expectStep(0)
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }))
    await expectStep(6)
    expect(params().get('source')).toBe('profile')
  })
})

describe('return to review', () => {
  it('opens review edit links with the return marker and validates before saving back to review', async () => {
    const state = setup()
    await fillRequired(state)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(screen.getByRole('button', { name: 'تعديل السعر' }))
    await expectStep(1)
    expect(params().get('from')).toBe('review')
    const save = screen.getByRole('button', { name: 'حفظ والعودة للمراجعة' })
    expect(screen.queryByRole('button', { name: 'التالي' })).toBeNull()
    fireEvent.change(screen.getByRole('textbox', { name: /السعر/ }), { target: { value: '' } })
    fireEvent.click(save)
    await waitFor(() => expect(state.wizard.form.formState.errors.price).toBeTruthy())
    await expectStep(1)
    expect(params().get('from')).toBe('review')
    fireEvent.change(screen.getByRole('textbox', { name: /السعر/ }), { target: { value: '500' } })
    fireEvent.click(save)
    await expectStep(6)
    expect(params().has('from')).toBe(false)
    expect(state.wizard.form.getValues('price')).toBe('500')
    expect(mocks.uploadAll).not.toHaveBeenCalled()
  })

  it('redirects to the first incomplete step instead of returning to invalid review', async () => {
    const state = setup()
    await fillRequired(state)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(screen.getByRole('button', { name: 'تعديل السعر' }))
    await expectStep(1)
    await act(async () => state.wizard.form.setValue('title', ''))
    fireEvent.change(screen.getByRole('textbox', { name: /السعر/ }), {
      target: { value: '500' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ والعودة للمراجعة' }))
    await expectStep(5)
    expect(params().has('from')).toBe(false)
    expect(state.wizard.form.getValues('title')).toBe('')
    expect(state.wizard.form.getValues('price')).toBe('500')
    expect(mocks.uploadAll).not.toHaveBeenCalled()
  })

  it('disables invalid review and clears the marker when using the stepper', async () => {
    const state = setup()
    await fillRequired(state)
    fireEvent.click(stepButton(6))
    await expectStep(6)
    fireEvent.click(screen.getByRole('button', { name: 'تعديل السعر' }))
    await expectStep(1)
    fireEvent.change(screen.getByRole('textbox', { name: /السعر/ }), { target: { value: '' } })
    expect(stepButton(6).disabled).toBe(true)
    fireEvent.click(stepButton(6))
    await expectStep(1)
    fireEvent.click(stepButton(0))
    await expectStep(0)
    expect(params().has('from')).toBe(false)
    expect(screen.getByRole('button', { name: 'التالي' })).toBeTruthy()
    expect(stepButton(6).disabled).toBe(true)
  })
})


it.each(['/wizard?step=7', '/wizard?step=5&from=review', '/wizard?from=review'])(
  'guards direct entry and refreshed URLs: %s', async (url) => {
    setup({ url })
    await expectStep(0)
    expect(params().has('from')).toBe(false)
    expect(screen.queryByRole('button', { name: 'حفظ والعودة للمراجعة' })).toBeNull()
  },
)

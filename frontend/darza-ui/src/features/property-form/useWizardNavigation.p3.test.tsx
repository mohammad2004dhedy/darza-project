// @vitest-environment jsdom
import { zodResolver } from '@hookform/resolvers/zod'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import { defaultValues, formSchema, type FormValues } from './schema'
import { useWizardNavigation } from './useWizardNavigation'

const validValues: FormValues = {
  ...defaultValues,
  propertyType: 'HOUSE',
  listingType: 'SELL',
  price: '100',
  currency: 'ILS',
  townId: '1',
  title: 'بيت للبيع',
  imagePaths: ['image.webp'],
}

afterEach(cleanup)

function Harness({ editMode }: { editMode: boolean }) {
  const form = useForm<FormValues>({ defaultValues: validValues, resolver: zodResolver(formSchema) })
  const navigation = useWizardNavigation(form, editMode, true)
  return <>
    <output data-testid="step">{navigation.step}</output>
    <output data-testid="completed">{JSON.stringify(navigation.completed)}</output>
    {navigation.step === 1 && <>
      <input aria-label="price" {...form.register('price')} />
      <input aria-label="currency" {...form.register('currency')} />
      {form.formState.errors.price && <p role="alert">{form.formState.errors.price.message}</p>}
      {form.formState.errors.currency && <p role="alert">{form.formState.errors.currency.message}</p>}
    </>}
    <button onClick={() => void navigation.go(0)}>earlier step</button>
    <button onClick={() => void navigation.go(3)}>later step</button>
    <button onClick={() => void navigation.go(navigation.step + 1)}>التالي</button>
    <button onClick={() => navigation.setStep(navigation.step - 1)}>السابق</button>
    <button onClick={() => void navigation.go(6)}>حفظ والعودة للمراجعة</button>
  </>
}

function mount(editMode: boolean, step = 1) {
  render(<MemoryRouter initialEntries={[`/properties/new?step=${step + 1}`]}>
    <Harness editMode={editMode} />
  </MemoryRouter>)
}

function expectStep(step: number) {
  expect(screen.getByTestId('step').textContent).toBe(String(step))
}

for (const editMode of [false, true]) {
  const mode = editMode ? 'edit' : 'create'
  it.each(['earlier step', 'later step', 'التالي', 'حفظ والعودة للمراجعة'])(
    `${mode}: clearing a required field blocks %s, shows errors and focuses the first invalid field`,
    async (action) => {
      mount(editMode)
      const price = screen.getByRole('textbox', { name: 'price' })
      fireEvent.change(price, { target: { value: '' } })
      fireEvent.change(screen.getByRole('textbox', { name: 'currency' }), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: action, exact: true }))
      await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
      expectStep(1)
      expect(document.activeElement).toBe(price)
    },
  )

  it(`${mode}: malformed values block Next until fixed and completion updates live`, async () => {
    mount(editMode)
    const price = screen.getByRole('textbox', { name: 'price' })
    expect(JSON.parse(screen.getByTestId('completed').textContent!)[1]).toBe(true)
    fireEvent.change(price, { target: { value: 'not-a-number' } })
    expect(JSON.parse(screen.getByTestId('completed').textContent!)[1]).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
    await screen.findByRole('alert')
    expectStep(1)
    fireEvent.change(price, { target: { value: '250' } })
    expect(JSON.parse(screen.getByTestId('completed').textContent!)[1]).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
    await waitFor(() => expectStep(2))
  })

  it(`${mode}: Back preserves invalid values and the earlier invalid step blocks every forward destination`, async () => {
    mount(editMode)
    fireEvent.change(screen.getByRole('textbox', { name: 'price' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'السابق' }))
    await waitFor(() => expectStep(0))
    expect(JSON.parse(screen.getByTestId('completed').textContent!)[1]).toBe(false)
    for (const action of ['later step', 'حفظ والعودة للمراجعة']) {
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: action, exact: true })) })
      expectStep(0)
    }
    fireEvent.click(screen.getByRole('button', { name: 'التالي' }))
    await waitFor(() => expectStep(1))
    expect((screen.getByRole('textbox', { name: 'price' }) as HTMLInputElement).value).toBe('')
    fireEvent.change(screen.getByRole('textbox', { name: 'price' }), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ والعودة للمراجعة' }))
    await waitFor(() => expectStep(6))
  })

  it(`${mode}: a direct review URL cannot bypass a currently invalid required step`, async () => {
    function InvalidReview() {
      const form = useForm<FormValues>({ defaultValues: { ...validValues, price: '' }, resolver: zodResolver(formSchema) })
      const navigation = useWizardNavigation(form, editMode, true)
      return <output data-testid="step">{navigation.step}</output>
    }
    render(<MemoryRouter initialEntries={['/properties/new?step=7&from=review']}><InvalidReview /></MemoryRouter>)
    await waitFor(() => expectStep(1))
  })
}

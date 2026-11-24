// @vitest-environment jsdom
import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useForm } from 'react-hook-form'
import { DecimalInput } from './DecimalInput'
import { FormField } from './FormField'

function Harness({ maxDecimals = 2 }: { maxDecimals?: number }) {
  const [value, setValue] = useState('')
  return <FormField label="السعر" required><DecimalInput value={value} onChange={setValue} maxIntegerDigits={3} maxDecimals={maxDecimals} /></FormField>
}
afterEach(() => { cleanup(); vi.useRealTimers() })

it('normalizes typing, rejects precision overflow, and clears the hint on valid input', () => {
  render(<Harness />)
  const input = screen.getByLabelText(/السعر/) as HTMLInputElement
  expect(input.type).toBe('text')
  expect(input.inputMode).toBe('decimal')
  expect(input.required).toBe(true)
  fireEvent.change(input, { target: { value: '٠٠٧,٥٦' } })
  expect(input.value).toBe('7.56')
  fireEvent.change(input, { target: { value: '7.567' } })
  expect(input.value).toBe('7.56')
  expect(screen.getByRole('status').textContent).toBe('حتى خانتين بعد الفاصلة فقط')
  expect(input.getAttribute('aria-invalid')).toBeNull()
  fireEvent.change(input, { target: { value: '7.5' } })
  expect(screen.queryByRole('status')).toBeNull()
  fireEvent.change(input, { target: { value: '' } })
  expect(input.value).toBe('')
})

it('rejects integer overflow and expires the hint after two seconds', () => {
  vi.useFakeTimers()
  render(<Harness />)
  const input = screen.getByRole('textbox') as HTMLInputElement
  fireEvent.change(input, { target: { value: '123' } })
  fireEvent.change(input, { target: { value: '1234' } })
  expect(input.value).toBe('123')
  expect(screen.getByRole('status').textContent).toBe('حتى 3 خانات قبل الفاصلة')
  act(() => vi.advanceTimersByTime(2000))
  expect(screen.queryByRole('status')).toBeNull()
})

it('sanitizes and truncates paste including replacement selections', () => {
  render(<Harness />)
  const input = screen.getByRole('textbox') as HTMLInputElement
  fireEvent.paste(input, { clipboardData: { getData: () => 'USD ۱۲۳۴,۵۶۷' } })
  expect(input.value).toBe('123.56')
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => '٠٠٧٫٢' } })
  expect(input.value).toBe('7.2')
})

it('rejects decimal separators for integer fields and clears timers on unmount', () => {
  vi.useFakeTimers()
  const view = render(<Harness maxDecimals={0} />)
  const input = screen.getByRole('textbox') as HTMLInputElement
  fireEvent.change(input, { target: { value: '12' } })
  fireEvent.change(input, { target: { value: '12.' } })
  expect(input.value).toBe('12')
  expect(screen.getByRole('status').textContent).toBe('أعداد صحيحة فقط')
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('forwards the ref and preserves labels, errors and react-hook-form changes', () => {
  function Form() {
    const { register, watch } = useForm({ defaultValues: { price: '' } })
    const registered = register('price')
    return <FormField label="السعر" error="خطأ"><DecimalInput {...registered} value={watch('price')} onChange={(value) => void registered.onChange({ target: { name: 'price', value } })} maxIntegerDigits={3} maxDecimals={2} /></FormField>
  }
  render(<Form />)
  const input = screen.getByLabelText('السعر') as HTMLInputElement
  expect(input.getAttribute('aria-invalid')).toBe('true')
  fireEvent.change(input, { target: { value: '۱۲٫۳' } })
  expect(input.value).toBe('12.3')
  expect(screen.getByRole('alert').textContent).toBe('خطأ')
})

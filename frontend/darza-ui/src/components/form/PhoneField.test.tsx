// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhoneField } from './PhoneField'
import { usePhoneInput, type PhoneValue } from './usePhoneInput'

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState<PhoneValue>({ countryCode: '', phoneNumber: '' })
  const phone = usePhoneInput(value, setValue)
  return <PhoneField {...value} {...phone} error={error} />
}

function setup(error?: string) {
  const user = userEvent.setup()
  render(<Harness error={error} />)
  const number = screen.getByLabelText<HTMLInputElement>(/رقم الهاتف/)
  const code = screen.getByRole<HTMLSelectElement>('combobox', { name: 'كود الدولة' })
  const option970 = screen.getByRole<HTMLOptionElement>('option', { name: '+970' })
  return { user, number, code, option970 }
}

afterEach(cleanup)

describe('PhoneField', () => {
  it('requires a code choice for Palestinian numbers', async () => {
    const { user, number, code } = setup()
    await user.type(number, '0590000000')
    expect(number.value).toBe('590000000')
    expect(code.value).toBe('')
    expect(screen.getByRole('alert').textContent).toBe('اختار كود الدولة +970 أو +972')
    await user.selectOptions(code, '970')
    expect(code.value).toBe('970')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('selects 972 and disables 970 for Israeli prefixes', async () => {
    const { user, number, code, option970 } = setup()
    await user.type(number, '0540000000')
    expect(code.value).toBe('972')
    expect(option970.disabled).toBe(true)
    await user.selectOptions(code, '970')
    expect(code.value).toBe('972')
  })

  it('moves a pasted country code into the select', async () => {
    const { user, number, code } = setup()
    await user.click(number)
    await user.paste('+972 59-912-3456')
    expect(number.value).toBe('590000000')
    expect(code.value).toBe('972')
  })

  it('keeps a code the user picked for Palestinian numbers', async () => {
    const { user, number, code, option970 } = setup()
    await user.selectOptions(code, '972')
    await user.type(number, '0590000000')
    expect(code.value).toBe('972')
    expect(option970.disabled).toBe(false)
  })

  it('ignores input that cannot start a valid number', async () => {
    const { user, number } = setup()
    await user.type(number, '4')
    expect(number.value).toBe('')
  })

  it('shows the WhatsApp hint and the error under the field', () => {
    const { number } = setup('هاد الرقم لازم يكون مع الكود 972')
    expect(screen.getByText(/مثل المسجّلين على واتساب/)).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('هاد الرقم لازم يكون مع الكود 972')
    expect(number.getAttribute('aria-invalid')).toBe('true')
  })
})

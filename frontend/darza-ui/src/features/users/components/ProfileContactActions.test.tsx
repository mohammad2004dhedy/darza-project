// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ProfileContactActions } from './ProfileContactActions'

afterEach(cleanup)

it.each([undefined, '', 'invalid', '0590000000'])('hides contact actions for %s', (phoneNumber) => {
  const { container } = render(<ProfileContactActions phoneNumber={phoneNumber} />)
  expect(container.childElementCount).toBe(0)
})

it('offers valid contact links without printing the phone number', () => {
  const phone = '+970590000000'
  render(<ProfileContactActions phoneNumber={phone} />)
  expect(screen.getByRole('link', { name: 'اتصال' }).getAttribute('href')).toBe(`tel:${phone}`)
  const whatsapp = screen.getByRole('link', { name: 'واتساب' })
  const url = new URL(whatsapp.getAttribute('href')!)
  expect(url.origin + url.pathname).toBe('https://wa.me/970590000000')
  expect(url.searchParams.get('text')).toBe('مرحبا، شفت ملفك على درزة وأود الاستفسار عن إعلاناتك.')
  expect(whatsapp.getAttribute('rel')).toContain('noopener')
  expect(screen.queryByText(phone)).toBeNull()
})

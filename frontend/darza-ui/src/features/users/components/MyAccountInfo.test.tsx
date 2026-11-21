// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MyAccountInfo } from './MyAccountInfo'

afterEach(cleanup)

const user = {
  id: 1,
  displayName: 'أحمد',
  email: 'user@example.com',
  phoneNumber: '+970599123456',
  createdAt: '2025-01-01',
}

it('renders private email and phone left-to-right and omits a missing address', () => {
  render(<MyAccountInfo user={user} />)
  expect(screen.getByText(user.email).getAttribute('dir')).toBe('ltr')
  expect(screen.getByText(user.phoneNumber).getAttribute('dir')).toBe('ltr')
  expect(screen.queryByText('العنوان')).toBeNull()
})

it('includes an address when present', () => {
  render(<MyAccountInfo user={{ ...user, address: 'شارع القدس' }} />)
  expect(screen.getByText('شارع القدس')).toBeTruthy()
})

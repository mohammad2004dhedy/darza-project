// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ProfileHeader } from './ProfileHeader'

afterEach(cleanup)

it('shows the name, town and city, and Arabic join month with Latin digits', () => {
  render(
    <ProfileHeader
      user={{
        displayName: 'أحمد',
        town: { townId: 1, townName: 'بيرزيت', cityId: 1, cityName: 'رام الله' },
        createdAt: '2025-01-15T12:00:00Z',
      }}
    />,
  )
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('أحمد')
  expect(screen.getByText('بيرزيت، رام الله')).toBeTruthy()
  expect(screen.getByText('يناير 2025')).toBeTruthy()
  expect(screen.queryByText(/[٠-٩]/)).toBeNull()
})

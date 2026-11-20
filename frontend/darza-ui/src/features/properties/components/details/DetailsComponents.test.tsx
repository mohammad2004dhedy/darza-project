// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { AuthContext, type AuthValue } from '../../../../context/auth'
import type { PropertyDetailsResponse } from '../../../../types/api'
import * as phone from '../../../../lib/phone'
import { ContactBar } from './ContactBar'
import { PropertyKeyFacts } from './PropertyKeyFacts'
import { PropertyLocation } from './PropertyLocation'
import { OwnerStatusNotice } from './OwnerStatusNotice'
import { PublisherCard } from './PublisherCard'

const property: PropertyDetailsResponse = {
  id: 7,
  title: 'بيت',
  propertyType: 'HOUSE',
  listingType: 'SELL',
  price: 0,
  currency: 'ILS',
  isAvailable: false,
  town: { townId: 1, townName: 'بيرزيت', cityId: 1, cityName: 'رام الله' },
  user: { id: 9, displayName: 'ناشر', phoneNumber: '+970599123456' },
  images: [],
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('renders zero values, furnished false and a balcony', () => {
  render(
    <PropertyKeyFacts
      property={{
        ...property,
        areaSize: 0,
        rooms: 0,
        bathrooms: 0,
        furnished: false,
        hasBalcony: true,
      }}
    />,
  )
  expect(screen.getAllByText('0')).toHaveLength(3)
  expect(screen.getByText('غير مفروش')).toBeTruthy()
  expect(screen.getByText('شرفة')).toBeTruthy()
})
it('hides missing and null facts and false balcony', () => {
  const { container } = render(
    <PropertyKeyFacts
      property={
        {
          ...property,
          rooms: null,
          areaSize: null,
          bathrooms: null,
          furnished: null,
          hasBalcony: false,
        } as unknown as PropertyDetailsResponse
      }
    />,
  )
  expect(container.querySelector('section')?.children.length).toBe(0)
})
it('shows only area for LAND', () => {
  render(
    <PropertyKeyFacts
      property={{
        ...property,
        propertyType: 'LAND',
        areaSize: 10,
        rooms: 2,
        bathrooms: 1,
        furnished: true,
        hasBalcony: true,
      }}
    />,
  )
  expect(screen.getByText('10')).toBeTruthy()
  expect(screen.queryByText('غرف')).toBeNull()
  expect(screen.queryByText('مفروش')).toBeNull()
})
function renderContact(value = property, userId: number | null = null) {
  return render(
    <AuthContext.Provider value={{ userId } as AuthValue}>
      <ContactBar property={value} />
    </AuthContext.Provider>,
  )
}
it('keeps valid contact buttons active for unavailable properties', () => {
  renderContact()
  expect(screen.getByRole('link', { name: 'واتساب' }).getAttribute('href')).toContain(
    'https://wa.me/970599123456?text=',
  )
  expect(screen.getByRole('link', { name: 'اتصال' }).getAttribute('href')).toBe('tel:+970599123456')
})
it.each(['owner', 'missing', 'invalid'])('hides contacts for %s', (kind) => {
  const { container } = renderContact(
    {
      ...property,
      user: {
        ...property.user,
        phoneNumber:
          kind === 'missing'
            ? undefined
            : kind === 'invalid'
              ? 'invalid'
              : property.user.phoneNumber,
      },
    },
    kind === 'owner' ? 9 : null,
  )
  expect(container.innerHTML).toBe('')
})
it('hides each button independently when its helper returns null', () => {
  vi.spyOn(phone, 'toWhatsAppUrl').mockReturnValue(null)
  renderContact()
  expect(screen.queryByRole('link', { name: 'واتساب' })).toBeNull()
  expect(screen.getByRole('link', { name: 'اتصال' })).toBeTruthy()
  cleanup()
  vi.restoreAllMocks()
  vi.spyOn(phone, 'toTelUrl').mockReturnValue(null)
  renderContact()
  expect(screen.queryByRole('link', { name: 'اتصال' })).toBeNull()
  expect(screen.getByRole('link', { name: 'واتساب' })).toBeTruthy()
})
it('links zero coordinates to maps and prints the address', () => {
  render(
    <PropertyLocation property={{ ...property, latitude: 0, longitude: 0, address: 'الشارع' }} />,
  )
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    'https://www.google.com/maps/search/?api=1&query=0,0',
  )
  expect(screen.getByText('الشارع')).toBeTruthy()
})
it('shows pending and rejected notices, not approved notices', () => {
  const { rerender } = render(
    <OwnerStatusNotice property={{ ...property, postingStatus: 'PENDING' }} />,
  )
  expect(screen.getByRole('status').textContent).toContain('قيد المراجعة')
  rerender(
    <OwnerStatusNotice
      property={{ ...property, postingStatus: 'REJECTED', rejectionReason: 'سبب الرفض' }}
    />,
  )
  expect(screen.getByText('سبب الرفض')).toBeTruthy()
  rerender(<OwnerStatusNotice property={{ ...property, postingStatus: 'APPROVED' }} />)
  expect(screen.queryByRole('status')).toBeNull()
})
it('links publisher with image fallback without exposing a phone', () => {
  render(
    <MemoryRouter>
      <PublisherCard user={{ ...property.user, profileImageUrl: '/avatar.jpg' }} />
    </MemoryRouter>,
  )
  fireEvent.error(document.querySelector('img')!)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/users/9')
  expect(screen.queryByText(property.user.phoneNumber!)).toBeNull()
})

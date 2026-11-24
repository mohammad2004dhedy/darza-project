// @vitest-environment jsdom
vi.mock('./PropertyMapPreview', () => ({ PropertyMapPreview: () => <div data-testid="map-preview" /> }))

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
  user: { id: 9, displayName: 'ناشر', phoneNumber: '+970590000000' },
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
  expect(screen.getByRole('link', { name: 'التواصل على واتساب' }).getAttribute('href')).toContain(
    'https://wa.me/970590000000?text=',
  )
  expect(screen.getByRole('link', { name: 'الاتصال بالمعلن' }).getAttribute('href')).toBe(
    'tel:+970590000000',
  )
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
  expect(screen.queryByRole('link', { name: 'التواصل على واتساب' })).toBeNull()
  expect(screen.getByRole('link', { name: 'الاتصال بالمعلن' })).toBeTruthy()
  cleanup()
  vi.restoreAllMocks()
  vi.spyOn(phone, 'toTelUrl').mockReturnValue(null)
  renderContact()
  expect(screen.queryByRole('link', { name: 'الاتصال بالمعلن' })).toBeNull()
  expect(screen.getByRole('link', { name: 'التواصل على واتساب' })).toBeTruthy()
})
it('links zero coordinates to maps and prints the address', () => {
  render(
    <PropertyLocation property={{ ...property, latitude: 0, longitude: 0, address: 'الشارع' }} />,
  )
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    'https://www.google.com/maps?q=0,0',
  )
  expect(screen.getByText('الشارع')).toBeTruthy()
  expect(screen.getByTestId('map-preview')).toBeTruthy()
  expect(screen.getByRole('link').getAttribute('rel')).toContain('noopener')
})
it('shows pending and rejected notices, not approved notices', () => {
  const { rerender } = render(
    <OwnerStatusNotice property={{ ...property, postingStatus: 'PENDING' }} />,
  )
  expect(screen.getByRole('status').textContent).toContain('الإعلان قيد المراجعة')
  expect(screen.getByRole('status').textContent).not.toContain('إعلانك')
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

it('keeps facts compact with three columns and twenty-pixel icons', () => {
  const { container } = render(<PropertyKeyFacts property={{ ...property, rooms: 2 }} />)
  expect(screen.getByRole('region', { name: 'مواصفات العقار' }).className).toContain('grid-cols-3')
  const tile = screen.getByText('2').parentElement!
  expect(tile.className).toContain('p-3')
  expect(tile.className).not.toContain('aspect-square')
  expect(screen.getByText('2').className).toContain('text-lg')
  expect(screen.getByText('غرف').className).toContain('text-xs')
  expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-5')
})

it('isolates town and city in the shared muted location line', () => {
  const { container } = render(<PropertyLocation property={property} />)
  expect([...container.querySelectorAll('bdi')].map((node) => node.textContent)).toEqual([
    'بيرزيت',
    'رام الله',
  ])
  expect(container.querySelector('bdi')?.closest('p')?.className).toContain('text-text-muted')
})

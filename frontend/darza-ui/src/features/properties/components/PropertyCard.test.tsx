// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import type { PropertyCardResponse } from '../../../types/api'
import { PropertyCard } from './PropertyCard'

afterEach(cleanup)

const baseProperty: PropertyCardResponse = {
  id: 42,
  title: 'أرض واسعة قرب المدينة',
  propertyType: 'LAND',
  listingType: 'SELL',
  price: 25000,
  currency: 'ILS',
  town: { townId: 8, townName: 'بيت لحم', cityId: 2, cityName: 'القدس' },
  isAvailable: true,
  user: { id: 7, displayName: 'ناشر العقار', phoneNumber: '599123456' },
}

function renderCard(property: PropertyCardResponse, eager?: boolean) {
  return render(
    <MemoryRouter>
      <PropertyCard property={property} eager={eager} />
    </MemoryRouter>,
  )
}

describe('PropertyCard', () => {
  it('overlays availability on the right and listing on the left, with type in the body', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={{ ...baseProperty, isAvailable: false }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('غير متاح').parentElement?.className).toContain('right-3')
    expect(screen.getByText('للبيع').parentElement?.className).toContain('left-3')
    expect(screen.getByText('أرض').querySelector('svg')).not.toBeNull()
  })

  it('renders optional data safely when image, rooms, bathrooms, area, and rent period are absent', () => {
    renderCard(baseProperty)

    expect(screen.getByRole('link', { name: baseProperty.title }).getAttribute('href')).toBe(
      '/properties/42',
    )
    expect(screen.getByLabelText('لا توجد صورة للعقار')).toBeTruthy()
    expect(screen.getByText('أرض')).toBeTruthy()
    expect(screen.getByText('للبيع')).toBeTruthy()
    expect(screen.queryByText(/غرف|حمامات|م²/)).toBeNull()
    expect(screen.queryByText(/بالساعة|باليوم|بالشهر|بالسنة/)).toBeNull()
    expect(screen.getByText('القدس - بيت لحم')).toBeTruthy()
    expect(screen.queryByText('599123456')).toBeNull()
  })

  it('omits optional values returned as null', () => {
    const property = {
      ...baseProperty,
      coverImageUrl: null,
      areaSize: null,
      rooms: null,
      bathrooms: null,
      listingType: 'RENT',
      rentPeriod: null,
    } as unknown as PropertyCardResponse
    renderCard(property)

    expect(screen.getByLabelText('لا توجد صورة للعقار')).toBeTruthy()
    expect(screen.queryByText(/غرف|حمامات|م²/)).toBeNull()
    expect(screen.queryByText(/بالساعة|باليوم|بالشهر|بالسنة/)).toBeNull()
  })

  it('hides room and bathroom counts for land, including zero values', () => {
    renderCard({ ...baseProperty, rooms: 0, bathrooms: 0, areaSize: 0 })

    expect(screen.getByText('0 م²')).toBeTruthy()
    expect(screen.queryByText(/غرف|حمامات/)).toBeNull()
  })

  it('shows zero price, area, rooms and bathrooms for a property', () => {
    renderCard({
      ...baseProperty,
      propertyType: 'APARTMENT',
      price: 0,
      areaSize: 0,
      rooms: 0,
      bathrooms: 0,
    })
    expect(screen.getByText('0 ₪')).toBeTruthy()
    expect(screen.getByText('0 م²')).toBeTruthy()
    expect(screen.getByText('0 غرف')).toBeTruthy()
    expect(screen.getByText('0 حمامات')).toBeTruthy()
  })

  it('assigns unique accessible labels to multiple cards', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={baseProperty} />
        <PropertyCard property={{ ...baseProperty, id: 43, title: 'عقار آخر', price: 0 }} />
      </MemoryRouter>,
    )
    const links = [
      screen.getByRole('link', { name: baseProperty.title }),
      screen.getByRole('link', { name: 'عقار آخر' }),
    ]
    const ids = links.flatMap((link) => (link.getAttribute('aria-describedby') ?? '').split(' '))
    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
    for (const id of ids) expect(document.getElementById(id)).not.toBeNull()
    expect(
      screen.getByRole('link', { name: 'عقار آخر' }).getAttribute('aria-describedby'),
    ).toBeTruthy()
  })

  it('shows rent period only for rentals and supports eager cover loading', () => {
    const property: PropertyCardResponse = {
      ...baseProperty,
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      rentPeriod: 'MONTHLY',
      coverImageUrl: 'https://example.test/cover.jpg',
      rooms: 2,
      bathrooms: 1,
      areaSize: 90,
    }
    renderCard(property, true)

    expect(screen.getByText('بالشهر')).toBeTruthy()
    expect(screen.getByText('90 م²')).toBeTruthy()
    expect(screen.getByText('2 غرف')).toBeTruthy()
    expect(screen.getByText('1 حمامات')).toBeTruthy()
    expect(screen.getByRole('img', { name: property.title }).getAttribute('loading')).toBe('eager')
    expect(screen.getByRole('img', { name: property.title }).getAttribute('decoding')).toBe('async')
    expect(screen.getByRole('img', { name: property.title }).getAttribute('width')).toBe('640')
    expect(screen.getByRole('img', { name: property.title }).getAttribute('height')).toBe('480')
  })

  it('shows a placeholder when the image fails and recovers for a new URL', () => {
    const { rerender } = renderCard({
      ...baseProperty,
      coverImageUrl: 'https://example.test/broken.jpg',
    })
    fireEvent.error(screen.getByRole('img', { name: baseProperty.title }))
    expect(screen.getByLabelText('لا توجد صورة للعقار')).toBeTruthy()
    rerender(
      <MemoryRouter>
        <PropertyCard
          property={{ ...baseProperty, coverImageUrl: 'https://example.test/other.jpg' }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('img', { name: baseProperty.title }).getAttribute('src')).toContain(
      'other.jpg',
    )
  })

  it('has two sibling links and opens the publisher independently', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PropertyCard property={baseProperty} />} />
          <Route path="/users/:id" element={<p>صفحة الناشر</p>} />
          <Route path="/properties/:id" element={<p>صفحة العقار</p>} />
        </Routes>
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    const title = screen.getByRole('link', { name: baseProperty.title })
    const publisher = screen.getByRole('link', { name: 'الناشر: ناشر العقار' })
    expect(title.getAttribute('href')).toBe('/properties/42')
    expect(publisher.getAttribute('href')).toBe('/users/7')
    expect(title.contains(publisher)).toBe(false)
    expect(publisher.contains(title)).toBe(false)
    fireEvent.click(publisher)
    expect(screen.getByText('صفحة الناشر')).toBeTruthy()
    expect(screen.queryByText('صفحة العقار')).toBeNull()
  })

  it('shows a decorative lazy avatar, fallback and truncated long name', () => {
    const longName = 'ناشر طويل '.repeat(20)
    const property = {
      ...baseProperty,
      user: {
        ...baseProperty.user,
        displayName: longName,
        profileImageUrl: 'https://example.test/avatar.jpg',
      },
    }
    renderCard(property)
    const publisher = screen.getByRole('link', { name: /الناشر:/ })
    const avatar = publisher.querySelector('img')!
    expect(avatar.getAttribute('alt')).toBe('')
    expect(avatar.getAttribute('width')).toBe('32')
    expect(avatar.getAttribute('height')).toBe('32')
    expect(avatar.getAttribute('loading')).toBe('lazy')
    expect(avatar.getAttribute('decoding')).toBe('async')
    expect(publisher.querySelector('.truncate')?.textContent).toBe(longName)
    fireEvent.error(avatar)
    expect(publisher.querySelector('img')).toBeNull()
    expect(publisher.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('uses the publisher fallback when the avatar is absent', () => {
    renderCard(baseProperty)
    const publisher = screen.getByRole('link', { name: 'الناشر: ناشر العقار' })
    expect(publisher.querySelector('img')).toBeNull()
    expect(publisher.querySelector('[aria-hidden="true"]')).toBeTruthy()
    expect(screen.queryByText('599123456')).toBeNull()
  })

  it('does not expose public moderation fields', () => {
    renderCard({ ...baseProperty, postingStatus: 'APPROVED', rejectionReason: 'internal note' })

    expect(screen.queryByText('APPROVED')).toBeNull()
    expect(screen.queryByText('internal note')).toBeNull()
  })
})

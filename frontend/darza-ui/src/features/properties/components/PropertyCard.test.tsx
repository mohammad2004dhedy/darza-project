// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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
  it('renders optional data safely when image, rooms, bathrooms, area, and rent period are absent', () => {
    renderCard(baseProperty)

    expect(
      screen
        .getByRole('link', { name: /أرض واسعة قرب المدينة.*25,000.*القدس.*بيت لحم/ })
        .getAttribute('href'),
    ).toBe('/properties/42')
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

  it('does not expose public moderation fields', () => {
    renderCard({ ...baseProperty, postingStatus: 'APPROVED', rejectionReason: 'internal note' })

    expect(screen.queryByText('APPROVED')).toBeNull()
    expect(screen.queryByText('internal note')).toBeNull()
  })
})

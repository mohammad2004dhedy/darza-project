// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { PropertyCardResponse } from '../../../types/api'
import { PropertyCard } from './PropertyCard'

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

  it('shows rent period only for rentals and supports eager cover loading', () => {
    const property: PropertyCardResponse = {
      ...baseProperty,
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
  })

  it('does not expose public moderation fields', () => {
    renderCard({ ...baseProperty, postingStatus: 'APPROVED', rejectionReason: 'internal note' })

    expect(screen.queryByText('APPROVED')).toBeNull()
    expect(screen.queryByText('internal note')).toBeNull()
  })
})

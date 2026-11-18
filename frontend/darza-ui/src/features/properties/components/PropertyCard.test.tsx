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

    expect(screen.getByRole('link', { name: baseProperty.title })).toHaveAttribute(
      'href',
      '/properties/42',
    )
    expect(screen.getByLabelText('لا توجد صورة للعقار')).toBeInTheDocument()
    expect(screen.getByText('أرض')).toBeInTheDocument()
    expect(screen.getByText('للبيع')).toBeInTheDocument()
    expect(screen.queryByText(/غرف|حمامات|م²/)).not.toBeInTheDocument()
    expect(screen.queryByText(/بالساعة|باليوم|بالشهر|بالسنة/)).not.toBeInTheDocument()
    expect(screen.getByText('القدس - بيت لحم')).toBeInTheDocument()
    expect(screen.queryByText('599123456')).not.toBeInTheDocument()
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

    expect(screen.getByText('بالشهر')).toBeInTheDocument()
    expect(screen.getByText('90 م²')).toBeInTheDocument()
    expect(screen.getByText('2 غرف')).toBeInTheDocument()
    expect(screen.getByText('1 حمامات')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: property.title })).toHaveAttribute('loading', 'eager')
    expect(screen.getByRole('img', { name: property.title })).toHaveAttribute('decoding', 'async')
  })

  it('does not expose public moderation fields', () => {
    renderCard({ ...baseProperty, postingStatus: 'APPROVED', rejectionReason: 'internal note' })

    expect(screen.queryByText('APPROVED')).not.toBeInTheDocument()
    expect(screen.queryByText('internal note')).not.toBeInTheDocument()
  })
})

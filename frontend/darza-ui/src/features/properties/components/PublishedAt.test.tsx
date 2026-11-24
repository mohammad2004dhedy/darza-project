// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { PublishedAt } from './PublishedAt'
import { PropertyCard } from './PropertyCard'
import { formatPublishedAt } from '../../../lib/formatPublishedAt'

const now = Date.parse('2026-11-24T12:00:00Z')
afterEach(cleanup)

it.each([
  [20, 'الآن'],
  [5 * 60, 'منذ 5 دقائق'],
  [2 * 3600, 'منذ ساعتين'],
  [3 * 86400, 'منذ 3 أيام'],
  [30 * 86400, 'منذ شهر واحد'],
  [365 * 86400, 'منذ سنة واحدة'],
  [-60, 'الآن'],
])('formats an age of %s seconds with Latin digits', (seconds, relative) => {
  const iso = new Date(now - seconds * 1000).toISOString()
  expect(formatPublishedAt(iso, now)?.relative).toBe(relative)
  render(<PublishedAt iso={iso} now={now} />)
  expect(screen.getByText(relative).closest('time')?.dateTime).toBe(iso)
  expect(screen.getByText(relative).closest('time')?.querySelector('svg')).not.toBeNull()
})

it.each([undefined, '', 'invalid'])('renders nothing for %s', (iso) => {
  expect(formatPublishedAt(iso, now)).toBeNull()
  const { container } = render(<PublishedAt iso={iso} now={now} details />)
  expect(container.innerHTML).toBe('')
})

it('renders a long date and full timestamp title on details', () => {
  const iso = '2026-11-24T11:55:00Z'
  render(<PublishedAt iso={iso} now={now} details />)
  const time = screen.getByText(/^نُشر في/).closest('time')!
  expect(time.dateTime).toBe(iso)
  expect(time.textContent).toContain(
    new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'long' }).format(new Date(iso)),
  )
  expect(time.textContent).toContain(' · منذ 5 دقائق')
  expect(time.title).toBe(
    new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'long', timeStyle: 'long' }).format(
      new Date(iso),
    ),
  )
})

it.each([undefined, '2026-11-24T11:55:00Z'])(
  'keeps publication outside the publisher and stretched links: %s',
  (approvedAt) => {
    const { container } = render(
      <MemoryRouter>
        <PropertyCard
          property={{
            id: 7,
            title: 'عقار',
            propertyType: 'HOUSE',
            listingType: 'SELL',
            price: 100,
            currency: 'USD',
            isAvailable: true,
            town: { townId: 1, townName: 'بلدة', cityId: 1, cityName: 'مدينة' },
            user: { id: 8, displayName: 'ناشر' },
            approvedAt,
          }}
        />
      </MemoryRouter>,
    )
    expect(container.querySelectorAll('time')).toHaveLength(approvedAt ? 1 : 0)
    expect(container.querySelector('a a')).toBeNull()
    expect(container.querySelector('a time')).toBeNull()
    expect(screen.getByRole('link', { name: 'عقار' }).className).toContain('after:absolute')
  },
)

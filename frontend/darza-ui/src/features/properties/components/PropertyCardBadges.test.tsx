// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ListingTypeBadge, PropertyTypeBadge } from './PropertyCardBadges'
import { Tag } from './Tag'

afterEach(cleanup)

it('uses the same tag styling for property, listing and other tags', () => {
  render(
    <>
      <PropertyTypeBadge propertyType="HOUSE" />
      <ListingTypeBadge listingType="SELL" />
      <Tag>other</Tag>
    </>,
  )
  const tag = screen.getByText('other')
  const tags = [...tag.parentElement!.querySelectorAll('span')]
  expect(tags).toHaveLength(3)
  expect(tags.every((node) => node.className === tag.className)).toBe(true)
})

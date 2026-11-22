// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PropertyMapPreview } from './PropertyMapPreview'

vi.mock('../../../location/components/MapView', () => ({ MapView: () => <div data-testid="map-view" /> }))
afterEach(() => vi.unstubAllGlobals())
it('defers the non-interactive map until the preview approaches the viewport', async () => {
  let callback!: IntersectionObserverCallback
  vi.stubGlobal('IntersectionObserver', class { constructor(cb: IntersectionObserverCallback) { callback = cb } observe() {} disconnect() {} unobserve() {} })
  render(<PropertyMapPreview latitude={31.9} longitude={35.2} mapsUrl="https://www.google.com/maps?q=31.9,35.2" />)
  expect(screen.queryByTestId('map-view')).toBeNull()
  await act(async () => { callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver) })
  expect(await screen.findByTestId('map-view')).toBeTruthy()
  const link = screen.getByRole('link', { name: 'افتح الموقع في خرائط جوجل' })
  expect(link.getAttribute('href')).toBe('https://www.google.com/maps?q=31.9,35.2')
  expect(link.getAttribute('rel')).toContain('noopener')
})

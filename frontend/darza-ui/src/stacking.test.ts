import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

it('defines one ordered stacking scale below native dialogs', () => {
  const css = source('./index.css')
  const layer = (name: string) => Number(css.match(new RegExp(`--z-${name}: (\\d+);`))?.[1])
  expect(['inner-overlay', 'inner-badge', 'inner-link', 'inner-actions'].map(layer)).toEqual([
    1, 2, 3, 10,
  ])
  expect(['tabs', 'navigation', 'toast'].map(layer)).toEqual([30, 40, 60])
})

it('contains card layers while keeping sticky navigation above cards', () => {
  const card = source('./features/properties/components/PropertyCard.tsx')
  expect(card).toContain('relative isolate h-full')
  expect(card).toContain('relative z-(--z-inner-actions)')
  expect(card).toContain('absolute inset-0 z-(--z-inner-overlay)')
  expect(source('./features/properties/components/PropertyCardPublisher.tsx')).toContain(
    'relative z-(--z-inner-link)',
  )
  expect(source('./features/admin/AdminModeration.tsx')).toContain('sticky top-20 z-(--z-tabs)')
  expect(source('./components/layout/TopNavbar.tsx')).toContain('sticky top-0 z-(--z-navigation)')
  expect(source('./components/layout/BottomNav.tsx')).toContain('bottom-0 z-(--z-navigation)')
  expect(source('./components/ui/ToastProvider.tsx')).toContain('top-20 z-(--z-toast)')
})

it('isolates Leaflet panes below local map actions and preserves native modal sheets', () => {
  expect(source('./features/location/components/MapView.tsx')).toContain(
    'className="relative isolate h-full"',
  )
  for (const path of [
    './features/property-form/components/LocationPicker.tsx',
    './features/properties/components/details/PhotoViewer.tsx',
  ]) {
    const component = source(path)
    expect(component).toContain('<dialog')
    expect(component).not.toMatch(/\bz-(?:\d|\[|\()/)
  }
  expect(source('./features/property-form/components/LocationPicker.tsx')).toContain('.showModal()')
})

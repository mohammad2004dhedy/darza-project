// @vitest-environment jsdom
import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MapView } from './MapView'

const leaflet = vi.hoisted(() => {
  const handler = () => ({ enable: vi.fn(), disable: vi.fn() })
  const map = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    dragging: handler(),
    touchZoom: handler(),
    doubleClickZoom: handler(),
    scrollWheelZoom: handler(),
    boxZoom: handler(),
    keyboard: handler(),
  }
  const marker = {
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn(),
    getLatLng: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    dragging: handler(),
  }
  const zoom = { addTo: vi.fn(), remove: vi.fn() }
  return {
    map,
    marker,
    zoom,
    createMap: vi.fn(() => map),
    createMarker: vi.fn(() => marker),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    divIcon: vi.fn(),
  }
})

vi.mock('leaflet', () => ({
  map: leaflet.createMap,
  marker: leaflet.createMarker,
  tileLayer: leaflet.tileLayer,
  divIcon: leaflet.divIcon,
  control: { zoom: () => leaflet.zoom },
}))
vi.mock('leaflet/dist/leaflet.css', () => ({}))

let resize: () => void
const disconnect = vi.fn()
const observe = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  leaflet.createMap.mockImplementation(() => leaflet.map)
  leaflet.marker.getLatLng.mockReturnValue({ lat: 32.1, lng: 35.3 })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe = observe
      disconnect = disconnect
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function ready() {
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  expect(screen.queryByRole('alert')).toBeNull()
}

it('loads lazily with a default center, nonanimated map and OSM attribution', async () => {
  expect(leaflet.createMap).not.toHaveBeenCalled()
  render(<MapView interactive />)
  expect(screen.getByRole('status').textContent).toBe('جاري تحميل الخريطة')
  await ready()
  expect(leaflet.createMap).toHaveBeenCalledWith(
    screen.getByRole('region', { name: 'خريطة موقع العقار' }),
    expect.objectContaining({
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }),
  )
  expect(leaflet.map.setView).toHaveBeenCalledWith([31.9, 35.2], 8)
  expect(leaflet.createMarker).not.toHaveBeenCalled()
  expect(leaflet.tileLayer).toHaveBeenCalledWith(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    expect.objectContaining({
      attribution: expect.stringContaining('https://www.openstreetmap.org/copyright'),
    }),
  )
  expect(leaflet.divIcon).toHaveBeenCalledWith(
    expect.objectContaining({ html: expect.stringContaining('bg-primary') }),
  )
})

it('centers supplied coordinates at zoom 15 and supports click and marker correction', async () => {
  const onChange = vi.fn()
  render(<MapView lat={31.8} lng={35.1} interactive onChange={onChange} />)
  await ready()
  expect(leaflet.map.setView).toHaveBeenLastCalledWith([31.8, 35.1], 15, { animate: false })
  expect(leaflet.createMarker).toHaveBeenCalledWith(
    [31.8, 35.1],
    expect.objectContaining({ draggable: true }),
  )
  const click = leaflet.map.on.mock.calls.find(([name]) => name === 'click')![1]
  click({ latlng: { lat: 31.95, lng: 35.25 } })
  expect(leaflet.marker.setLatLng).toHaveBeenLastCalledWith([31.95, 35.25])
  expect(onChange).toHaveBeenLastCalledWith(31.95, 35.25)
  const drag = leaflet.marker.on.mock.calls.find(([name]) => name === 'dragend')![1]
  drag()
  expect(onChange).toHaveBeenLastCalledWith(32.1, 35.3)
})

it('uses fresh callbacks without recreating the map or recentering on echoed selection', async () => {
  const original = vi.fn()
  const replacement = vi.fn()
  const view = render(<MapView lat={31.8} lng={35.1} interactive onChange={original} />)
  await ready()
  const click = leaflet.map.on.mock.calls.find(([name]) => name === 'click')![1]
  const centers = leaflet.map.setView.mock.calls.length
  view.rerender(<MapView lat={31.8} lng={35.1} interactive onChange={replacement} />)
  click({ latlng: { lat: 32, lng: 35 } })
  expect(original).not.toHaveBeenCalled()
  expect(replacement).toHaveBeenCalledWith(32, 35)
  view.rerender(<MapView lat={32} lng={35} interactive onChange={replacement} />)
  expect(leaflet.map.setView).toHaveBeenCalledTimes(centers)
  expect(leaflet.createMap).toHaveBeenCalledTimes(1)
  view.rerender(<MapView lat={32.2} lng={35.4} interactive onChange={replacement} />)
  expect(leaflet.map.setView).toHaveBeenLastCalledWith([32.2, 35.4], 15, { animate: false })
  view.rerender(<MapView interactive onChange={replacement} />)
  expect(leaflet.marker.remove).toHaveBeenCalledOnce()
  expect(leaflet.map.setView).toHaveBeenLastCalledWith([31.9, 35.2], 8, { animate: false })
})

it('disables interactions for previews, and enables picking when made interactive', async () => {
  const onChange = vi.fn()
  const view = render(<MapView lat={31.8} lng={35.1} interactive={false} onChange={onChange} />)
  await ready()
  expect(leaflet.map.dragging.disable).toHaveBeenCalled()
  expect(leaflet.map.keyboard.disable).toHaveBeenCalled()
  expect(leaflet.marker.dragging.disable).toHaveBeenCalled()
  const click = leaflet.map.on.mock.calls.find(([name]) => name === 'click')![1]
  click({ latlng: { lat: 32, lng: 35 } })
  expect(onChange).not.toHaveBeenCalled()
  view.rerender(<MapView lat={31.8} lng={35.1} interactive onChange={onChange} />)
  expect(leaflet.map.dragging.enable).toHaveBeenCalled()
  expect(leaflet.marker.dragging.enable).toHaveBeenCalled()
  expect(leaflet.zoom.addTo).toHaveBeenCalledWith(leaflet.map)
  click({ latlng: { lat: 32, lng: 35 } })
  expect(onChange).toHaveBeenCalledWith(32, 35)
})

it('observes sheet resizing and cleans up on unmount', async () => {
  const view = render(<MapView interactive />)
  await ready()
  expect(observe).toHaveBeenCalledWith(screen.getByRole('region'))
  resize()
  expect(leaflet.map.invalidateSize).toHaveBeenCalledWith({ pan: false })
  view.unmount()
  expect(disconnect).toHaveBeenCalledOnce()
  expect(leaflet.map.remove).toHaveBeenCalledOnce()
})

it('does not initialize after unmount while the dynamic import is pending', async () => {
  const view = render(<MapView interactive />)
  view.unmount()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(leaflet.createMap).not.toHaveBeenCalled()
})

it('initializes only the live mount under StrictMode', async () => {
  render(
    <StrictMode>
      <MapView interactive />
    </StrictMode>,
  )
  await ready()
  expect(leaflet.createMap).toHaveBeenCalledOnce()
})

it('shows an Arabic fallback when initialization fails', async () => {
  leaflet.createMap.mockImplementationOnce(() => {
    throw new Error('Unavailable')
  })
  render(<MapView interactive />)
  expect((await screen.findByRole('alert')).textContent).toBe(
    'تعذّر تحميل الخريطة، يرجى المحاولة مرة أخرى',
  )
  expect(screen.queryByRole('status')).toBeNull()
})

it('requires both finite coordinates before adding a marker', async () => {
  const view = render(<MapView lat={31.8} interactive={false} />)
  await ready()
  expect(leaflet.createMarker).not.toHaveBeenCalled()
  view.rerender(<MapView lat={Number.NaN} lng={35.1} interactive={false} />)
  expect(leaflet.createMarker).not.toHaveBeenCalled()
})

it('disposes a partially initialized map on failure', async () => {
  leaflet.tileLayer.mockImplementationOnce(() => {
    throw new Error('Tile initialization failed')
  })
  render(<MapView interactive />)
  await screen.findByRole('alert')
  expect(leaflet.map.remove).toHaveBeenCalledOnce()
})

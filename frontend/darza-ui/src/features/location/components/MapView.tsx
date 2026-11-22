import { useEffect, useRef, useState } from 'react'
import type { LeafletMouseEvent, Marker } from 'leaflet'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'

type MapViewProps = {
  lat?: number
  lng?: number
  interactive: boolean
  onChange?: (lat: number, lng: number) => void
}

export function MapView(props: MapViewProps) {
  const container = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  const instance = useRef<{ sync: (props: MapViewProps) => void } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    latest.current = props
    instance.current?.sync(props)
  }, [props])

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined

    async function initialize() {
      try {
        const [L] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        if (cancelled || !container.current) return

        const map = L.map(container.current, {
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
          zoomControl: false,
        }).setView([31.9, 35.2], 8)
        let observer: ResizeObserver | undefined
        dispose = () => {
          observer?.disconnect()
          map.remove()
        }

        const icon = L.divIcon({
          className: '',
          html: '<span class="block size-6 rounded-full border-4 border-surface bg-primary shadow-md"></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const zoomControl = L.control.zoom()
        let marker: Marker | undefined
        let coordinates: string | undefined
        let interactive: boolean | undefined

        function select(lat: number, lng: number) {
          coordinates = `${lat},${lng}`
          if (marker) marker.setLatLng([lat, lng])
          else {
            marker = L.marker([lat, lng], {
              icon,
              draggable: latest.current.interactive,
              autoPan: latest.current.interactive,
              keyboard: latest.current.interactive,
              title: 'موقع العقار',
              alt: 'موقع العقار',
            }).addTo(map)
            marker.on('dragend', () => {
              if (!marker || !latest.current.interactive) return
              const position = marker.getLatLng()
              coordinates = `${position.lat},${position.lng}`
              latest.current.onChange?.(position.lat, position.lng)
            })
          }
        }

        map.on('click', (event: LeafletMouseEvent) => {
          if (!latest.current.interactive) return
          select(event.latlng.lat, event.latlng.lng)
          latest.current.onChange?.(event.latlng.lat, event.latlng.lng)
        })

        const sync = (current: MapViewProps) => {
          const hasCoordinates = Number.isFinite(current.lat) && Number.isFinite(current.lng)
          const nextCoordinates = hasCoordinates ? `${current.lat},${current.lng}` : undefined
          // A parent's echo of a click/drag must not reset the user's viewport.
          if (nextCoordinates !== coordinates) {
            if (hasCoordinates) {
              select(current.lat!, current.lng!)
              map.setView([current.lat!, current.lng!], 15, { animate: false })
            } else {
              marker?.remove()
              marker = undefined
              coordinates = undefined
              map.setView([31.9, 35.2], 8, { animate: false })
            }
          }
          if (interactive !== current.interactive) {
            interactive = current.interactive
            for (const handler of [
              map.dragging,
              map.touchZoom,
              map.doubleClickZoom,
              map.scrollWheelZoom,
              map.boxZoom,
              map.keyboard,
            ]) {
              if (interactive) handler.enable()
              else handler.disable()
            }
            if (interactive) zoomControl.addTo(map)
            else zoomControl.remove()
          }
          if (current.interactive) marker?.dragging?.enable()
          else marker?.dragging?.disable()
        }
        instance.current = { sync }
        sync(latest.current)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
          observer.observe(container.current)
        }
        map.invalidateSize({ pan: false })
        setStatus('ready')
      } catch {
        dispose?.()
        dispose = undefined
        instance.current = null
        if (!cancelled) setStatus('error')
      }
    }

    void initialize()
    return () => {
      cancelled = true
      instance.current = null
      dispose?.()
    }
  }, [attempt])

  return (
    <div className="relative isolate h-full overflow-hidden rounded-lg bg-background">
      <div
        ref={container}
        role="region"
        aria-label="خريطة موقع العقار"
        className="h-full"
      />
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-[1000] grid place-items-center bg-background">
          <Spinner label="جاري تحميل الخريطة" />
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="absolute inset-0 z-[1000] grid place-content-center justify-items-center gap-3 bg-background p-4 text-center">
          <p className="text-danger">تعذر تحميل الخريطة</p>
          <Button variant="outline" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }}>إعادة المحاولة</Button>
        </div>
      )}
    </div>
  )
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Spinner } from '../../../../components/ui/Spinner'

const MapView = lazy(() => import('../../../location/components/MapView').then((module) => ({ default: module.MapView })))
type Props = { latitude: number; longitude: number; mapsUrl: string }

export function PropertyMapPreview({ latitude, longitude, mapsUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative h-48 overflow-hidden rounded-lg bg-background">
      {visible ? (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="افتح الموقع في خرائط جوجل" className="block h-full">
          <Suspense fallback={<div className="grid h-full place-items-center"><Spinner label="جاري تحميل الخريطة" /></div>}>
            <MapView lat={latitude} lng={longitude} interactive={false} />
          </Suspense>
        </a>
      ) : <div aria-label="معاينة الموقع قيد التحميل" className="h-full bg-background" />}
    </div>
  )
}

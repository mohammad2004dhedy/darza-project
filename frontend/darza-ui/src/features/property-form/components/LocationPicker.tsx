import { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { MapView } from '../../location/components/MapView'

type Point = { lat: number; lng: number }
type Props = {
  lat?: number
  lng?: number
  state: { status: 'idle' | 'loading' | 'success' | 'error'; accuracy?: number; message?: string }
  onLocate: () => void
  onChange: (lat: number, lng: number) => void
  onClear: () => void
}

export function LocationPicker({ lat, lng, state, onLocate, onChange, onClear }: Props) {
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState<Point>()
  const dialog = useRef<HTMLDialogElement>(null)
  const hasPoint = lat !== undefined && lng !== undefined
  useEffect(() => {
    const element = dialog.current
    if (!picking && element?.open) element.close()
  }, [picking])
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm text-text-muted">تحديد الموقع الجغرافي اختياري.</p>
      <div className="space-y-1">
        <Button variant="outline" loading={state.status === 'loading'} onClick={onLocate} aria-describedby="current-location-hint">
          <LocateFixed aria-hidden="true" className="size-5" />استخدام موقعي الحالي
        </Button>
        <p id="current-location-hint" className="text-sm text-text-muted">موصى به إذا كان جهازك يدعم تحديد المواقع وكنت في موقع العقار</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span>أو</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" onClick={() => { setDraft(hasPoint ? { lat, lng } : undefined); dialog.current?.showModal(); setPicking(true) }}>
        <MapPin aria-hidden="true" className="size-5" />اختيار الموقع من الخريطة
      </Button>
      {state.status === 'error' && <p role="alert" className="text-sm text-danger">{state.message}</p>}
      {state.status === 'success' && state.accuracy !== undefined && state.accuracy > 1000 && (
        <p role="status" className="text-sm text-text-muted">دقة الموقع التقريبية {Math.round(state.accuracy)} متر. يُنصح بتعديل الموقع على الخريطة.</p>
      )}
      {hasPoint && (
        <>
          <p className="text-sm text-text-muted">يمكنك سحب العلامة لتصحيح الموقع.</p>
          <div className="h-64">
            <MapView lat={lat} lng={lng} interactive onChange={onChange} />
          </div>
          <Button variant="ghost" onClick={onClear}>إزالة الموقع</Button>
        </>
      )}
      <dialog ref={dialog} aria-labelledby="map-picker-title" onCancel={() => setPicking(false)} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border border-border bg-surface p-4 text-text backdrop:bg-text/50 overflow-y-auto sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-lg">
        {picking && <div className="flex min-h-full flex-col gap-4">
          <h2 id="map-picker-title" className="text-lg font-bold">اختيار الموقع من الخريطة</h2>
          <p className="text-sm text-text-muted">اضغط على الخريطة لتحديد الموقع أو اسحب العلامة.</p>
          <div className="h-[60dvh] min-h-64 shrink-0">
            <MapView lat={draft?.lat} lng={draft?.lng} interactive onChange={(nextLat, nextLng) => setDraft({ lat: nextLat, lng: nextLng })} />
          </div>
          <div className="flex gap-3">
            <Button disabled={!draft} onClick={() => { if (draft) { onChange(draft.lat, draft.lng); setPicking(false) } }}>تأكيد الموقع</Button>
            <Button variant="outline" onClick={() => setPicking(false)}>إلغاء</Button>
          </div>
        </div>}
      </dialog>
    </div>
  )
}

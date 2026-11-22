/* eslint-disable react-hooks/refs */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import type { UploadImage } from '../../useImageUploader'
import { Spinner } from '../../../../components/ui/Spinner'

type Props = {
  items: readonly UploadImage[]
  editMode: boolean
  disabled: boolean
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
  onMakeCover: (id: string) => void
}

function Tile({ image, index, editMode, disabled, onRemove, onMakeCover }: Omit<Props, 'items' | 'onReorder'> & { image: UploadImage; index: number }) {
  const sortable = useSortable({ id: image.id, disabled: disabled || (editMode && image.kind === 'existing') })
  const draggable = !disabled && (!editMode || image.kind === 'new')
  return (
    <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} {...sortable.attributes} className="relative overflow-hidden rounded-lg border border-border bg-background">
      <button type="button" {...sortable.listeners} disabled={!draggable} aria-label={`ترتيب الصورة ${index + 1}`} className="block w-full touch-pan-y disabled:cursor-default">
        <div className="flex aspect-square items-center justify-center">
          {image.url && <img src={image.url} alt={`صورة العقار ${index + 1}`} className="h-full w-full object-cover" />}
          {(image.status === 'processing' || image.status === 'uploading') && <div className="absolute inset-0 flex items-center justify-center bg-surface/80"><Spinner label={image.status === 'processing' ? 'جاري تجهيز الصورة' : 'جاري رفع الصورة'} /></div>}
        </div>
      </button>
      {index === 0 && <span className="absolute start-2 top-2 rounded bg-surface px-2 py-1 text-xs font-semibold">الغلاف</span>}
      <button type="button" aria-label={`حذف الصورة ${index + 1}`} disabled={disabled} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRemove(image.id) }} className="absolute end-1 top-1 flex size-11 items-center justify-center rounded-full bg-surface text-danger disabled:opacity-50"><X aria-hidden="true" className="size-5" /></button>
      {index > 0 && !editMode && <button type="button" disabled={disabled} onPointerDown={(event) => event.stopPropagation()} onClick={() => onMakeCover(image.id)} className="m-2 min-h-11 rounded border border-border px-2 text-sm font-semibold disabled:opacity-50">اجعلها الغلاف</button>}
      <p className="p-2 text-sm">{image.status === 'done' ? 'تم الرفع' : image.status === 'failed' ? 'تعذّر تجهيز أو رفع الصورة' : image.status === 'processing' ? 'جاري التجهيز' : image.status === 'uploading' ? 'جاري الرفع' : 'جاهزة للرفع'}</p>
      {image.error && <p role="alert" className="px-2 pb-2 text-sm text-danger">{image.error}</p>}
    </div>
  )
}

export function SortableImages({ items, editMode, disabled, onRemove, onReorder, onMakeCover }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  function onDragEnd({ active, over }: DragEndEvent) { if (over && active.id !== over.id) onReorder(String(active.id), String(over.id)) }
  return <DndContext sensors={sensors} onDragEnd={onDragEnd}><SortableContext items={items.map((image) => image.id)} strategy={rectSortingStrategy}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map((image, index) => <Tile key={image.id} image={image} index={index} editMode={editMode} disabled={disabled} onRemove={onRemove} onMakeCover={onMakeCover} />)}</div></SortableContext></DndContext>
}

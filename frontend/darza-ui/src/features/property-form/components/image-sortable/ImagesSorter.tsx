import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { type ReactNode, useCallback } from 'react'
import { Spinner } from '../../../../components/ui/Spinner'

export type ImagesSorterStatus =
  | 'processing'
  | 'ready'
  | 'pending'
  | 'uploading'
  | 'done'
  | 'failed'

export interface ImagesSorterItem {
  id: string
  url: string
  status: ImagesSorterStatus
  error?: string
  kind: 'existing' | 'new'
}

export interface ImagesSorterProps {
  items: readonly ImagesSorterItem[]
  disabled?: boolean
  editMode?: boolean
  onRemove: (id: string) => void
  onReorder: (items: ImagesSorterItem[]) => void
  onMakeCover: (id: string) => void
}

interface SortableImageProps {
  item: ImagesSorterItem
  index: number
  disabled: boolean
  editMode: boolean
  onRemove: (id: string) => void
  onMakeCover: (id: string) => void
}

const statusLabel: Record<ImagesSorterStatus, string> = {
  done: 'تم الرفع',
  failed: 'تعذّر تجهيز أو رفع الصورة',
  pending: 'جاهزة للرفع',
  processing: 'جاري التجهيز',
  ready: 'جاهزة للرفع',
  uploading: 'جاري الرفع',
}

function SortableImage({
  item,
  index,
  disabled,
  editMode,
  onRemove,
  onMakeCover,
}: SortableImageProps) {
  const canDrag = !disabled && (!editMode || item.kind === 'new')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canDrag,
  })
  const isLoading = item.status === 'processing' || item.status === 'uploading'

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        'relative overflow-hidden rounded-lg border border-border bg-background ' +
        (isDragging ? 'z-10 opacity-60' : '')
      }
      {...attributes}
      {...listeners}
    >
      <div className="flex aspect-square items-center justify-center">
        {item.url && (
          <img src={item.url} alt={'صورة العقار ' + (index + 1)} className="h-full w-full object-cover" />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
            <Spinner label={item.status === 'processing' ? 'جاري تجهيز الصورة' : 'جاري رفع الصورة'} />
          </div>
        )}
      </div>
      {index === 0 && (
        <span className="absolute start-2 top-2 rounded bg-surface px-2 py-1 text-xs font-semibold">
          الغلاف
        </span>
      )}
      {canDrag && (
        <span className="pointer-events-none absolute end-2 bottom-2 rounded bg-surface/90 p-1 text-text-muted">
          <GripVertical aria-hidden="true" className="size-4" />
        </span>
      )}
      <button
        type="button"
        aria-label={'حذف الصورة ' + (index + 1)}
        disabled={disabled}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onRemove(item.id)
        }}
        className="absolute end-1 top-1 flex size-11 items-center justify-center rounded-full bg-surface text-danger disabled:opacity-50"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
      <div className="space-y-1 p-2">
        <p className="text-sm">{statusLabel[item.status]}</p>
        {index > 0 && (
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onMakeCover(item.id)
            }}
            className="text-sm font-bold text-primary disabled:opacity-50"
          >
            اجعلها الغلاف
          </button>
        )}
        {item.error && (
          <p role="alert" className="text-sm text-danger">
            {item.error}
          </p>
        )}
      </div>
    </article>
  )
}

export function ImagesSorter({
  items,
  disabled = false,
  editMode = false,
  onRemove,
  onReorder,
  onMakeCover,
}: ImagesSorterProps): ReactNode {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (disabled || !over || active.id === over.id) return

      const source = items.find((item) => item.id === active.id)
      const destination = items.find((item) => item.id === over.id)
      if (!source || !destination || (editMode && (source.kind === 'existing' || destination.kind === 'existing'))) {
        return
      }

      const from = items.indexOf(source)
      const to = items.indexOf(destination)
      const reordered = [...items]
      reordered.splice(from, 1)
      reordered.splice(to, 0, source)
      onReorder(reordered)
    },
    [disabled, editMode, items, onReorder],
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <SortableImage
              key={item.id}
              item={item}
              index={index}
              disabled={disabled}
              editMode={editMode}
              onRemove={onRemove}
              onMakeCover={onMakeCover}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default ImagesSorter

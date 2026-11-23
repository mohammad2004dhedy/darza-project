import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Spinner } from '../../components/ui/Spinner'
import type { CityResponse } from '../../types/api'

interface Props {
  title: string; empty: string; items?: CityResponse[]; loading: boolean; error: boolean
  retry: () => void; busy: boolean; selected?: number
  onSelect?: (id: number) => void; onAdd: () => void
  onEdit: (item: CityResponse) => void; onDelete: (item: CityResponse) => void
}
export function LocationSection({ title, empty, items, loading, error, retry, busy, selected, onSelect, onAdd, onEdit, onDelete }: Props) {
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <Button onClick={onAdd} disabled={busy}>{title === 'المدن' ? 'إضافة مدينة' : 'إضافة بلدة'}</Button>
    </div>
    {loading ? <Spinner /> : error ? <ErrorMessage onRetry={retry} /> : !items?.length ? <EmptyState title={empty} /> :
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(item => <li key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4">
          {onSelect ? <button disabled={busy} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)} className={`min-w-0 flex-1 text-start ${selected === item.id ? 'font-bold text-primary' : 'text-text'}`}>{item.name}</button> : <span className="min-w-0 flex-1">{item.name}</span>}
          <Button variant="outline" disabled={busy} aria-label={`تعديل ${item.name}`} onClick={() => onEdit(item)}><Pencil size={18} /></Button>
          <Button variant="danger" disabled={busy} aria-label={`حذف ${item.name}`} onClick={() => onDelete(item)}><Trash2 size={18} /></Button>
        </li>)}
      </ul>}
  </section>
}

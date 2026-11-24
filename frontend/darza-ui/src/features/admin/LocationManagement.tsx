import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCities, useTowns } from '../location/hooks'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/useToast'
import { LocationFormModal } from './LocationFormModal'
import { LocationSection } from './LocationSection'
import { useLocationMutation, type LocationTarget } from './locationMutations'

export function LocationManagement() {
  const [params, setParams] = useSearchParams()
  const id = Number(params.get('city'))
  const cities = useCities()
  const cityId = cities.data?.some(city => city.id === id) ? id : undefined
  useEffect(() => {
    if (cities.isSuccess && params.has('city') && cityId === undefined) {
      setParams(previous => {
        const next = new URLSearchParams(previous)
        next.delete('city')
        return next
      }, { replace: true })
    }
  }, [cities.isSuccess, cityId, params, setParams])
  const towns = useTowns(cityId)
  const [editing, setEditing] = useState<LocationTarget>()
  const [deleting, setDeleting] = useState<LocationTarget>()
  const mutation = useLocationMutation()
  const locked = useRef(false)
  const { showToast } = useToast()
  const busy = mutation.isPending || !!editing
  function selectCity(id?: number) {
    setParams(previous => { const next = new URLSearchParams(previous); if (id) next.set('city', String(id)); else next.delete('city'); return next })
  }
  async function remove() {
    if (!deleting || locked.current) return
    locked.current = true
    try {
      await mutation.mutateAsync({ target: deleting, remove: true })
      if (deleting.kind === 'city' && deleting.id === cityId) selectCity()
      setDeleting(undefined)
      showToast('تم حذف الموقع')
    } catch (error) { showToast(error instanceof Error ? error.message : 'تعذر حذف الموقع') }
    finally { locked.current = false }
  }
  return <div className="space-y-8">
    <h1 className="text-2xl font-bold">إدارة المدن والبلدات</h1>
    <LocationSection title="المدن" empty="لا توجد مدن بعد" items={cities.data} loading={cities.isPending} error={cities.isError}
      retry={() => { void cities.refetch() }} busy={busy} selected={cityId} onSelect={selectCity}
      onAdd={() => setEditing({ kind: 'city', name: '' })}
      onEdit={item => setEditing({ kind: 'city', ...item })}
      onDelete={item => setDeleting({ kind: 'city', ...item })} />
    {cityId && <LocationSection title="البلدات" empty="لا توجد بلدات في هذه المدينة" items={towns.data} loading={towns.isPending} error={towns.isError}
      retry={() => { void towns.refetch() }} busy={busy}
      onAdd={() => setEditing({ kind: 'town', cityId, name: '' })}
      onEdit={item => setEditing({ kind: 'town', cityId, ...item })}
      onDelete={item => setDeleting({ kind: 'town', cityId, ...item })} />}
    {editing && <LocationFormModal target={editing} onClose={() => setEditing(undefined)} />}
    <ConfirmModal open={!!deleting} tone="danger" title="حذف الموقع" confirmText="حذف"
      message={`سيتم حذف «${deleting?.name ?? ''}» نهائياً. لن تُحذف البلدات أو حسابات المستخدمين المرتبطة به؛ قد يرفض النظام الحذف عند وجود ارتباطات.`}
      loading={mutation.isPending} onConfirm={() => { void remove() }} onCancel={() => setDeleting(undefined)} />
  </div>
}

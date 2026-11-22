import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../api/client'
import { Button } from '../../../components/ui/Button'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { useToast } from '../../../components/ui/useToast'
import { useAuth } from '../../../context/auth'
import type { PropertyCardResponse } from '../../../types/api'
import { isOwner } from '../../users/isOwner'
import { deleteProperty, setAvailability } from '../api'
import { invalidatePropertyQueries } from '../invalidate'

type Action = 'availability' | 'delete'

export function PropertyOwnerActions({
  property,
  compact = false,
}: {
  property: PropertyCardResponse
  compact?: boolean
}) {
  const { userId } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [action, setAction] = useState<Action | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locked = useRef(false)
  if (!isOwner(userId, property.user.id)) return null

  const availabilityLabel = property.isAvailable ? 'تمييز كغير متاح' : 'تمييز كمتاح'
  const approved = property.postingStatus === 'APPROVED' || !property.postingStatus

  function open(next: Action) {
    if (locked.current) return
    setError(null)
    setAction(next)
  }
  async function confirm() {
    if (!action || locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)
    try {
      if (action === 'delete') await deleteProperty(property.id)
      else await setAvailability(property.id)
      setAction(null)
      if (action === 'delete') {
        client.removeQueries({
          queryKey: ['properties', 'details', String(property.id)],
          exact: true,
        })
        if (!compact) navigate('/profile', { replace: true })
      }
      await invalidatePropertyQueries(client, userId)
      showToast(action === 'delete' ? 'تم حذف الإعلان' : 'تم تحديث حالة التوفر')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر تنفيذ الإجراء، حاول مرة أخرى')
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return (
    <section
      aria-label="إدارة الإعلان"
      className={
        compact ? 'relative z-10' : 'space-y-3 rounded-lg border border-border bg-surface p-4'
      }
    >
      {!compact && <h2 className="font-bold">إدارة إعلانك</h2>}
      <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-wrap gap-3'}>
        <ButtonLink
          to={`/properties/${property.id}/edit`}
          variant="outline"
          size={compact ? 'sm' : 'md'}
        >
          تعديل الإعلان
        </ButtonLink>
        {approved && (
          <Button
            variant="outline"
            size={compact ? 'sm' : 'md'}
            disabled={busy}
            onClick={() => open('availability')}
          >
            {availabilityLabel}
          </Button>
        )}
        <Button
          variant="danger"
          size={compact ? 'sm' : 'md'}
          disabled={busy}
          onClick={() => open('delete')}
        >
          حذف الإعلان
        </Button>
      </div>
      <ConfirmModal
        open={action !== null}
        title={action === 'delete' ? 'حذف الإعلان' : availabilityLabel}
        message={
          action === 'delete'
            ? 'سيتم حذف الإعلان نهائياً. لا يمكن التراجع عن هذا الإجراء.'
            : 'هل تريد تغيير حالة توفر هذا العقار؟'
        }
        confirmText={action === 'delete' ? 'حذف نهائياً' : 'تأكيد'}
        tone={action === 'delete' ? 'danger' : 'default'}
        loading={busy}
        onConfirm={() => void confirm()}
        onCancel={() => {
          if (!locked.current) setAction(null)
        }}
      >
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </ConfirmModal>
    </section>
  )
}

import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/useToast'
import { approveProperty, rejectProperty } from './api'

export function ModerationBar({
  propertyId,
  onSuccess,
}: {
  propertyId: number
  onSuccess?: () => void
}) {
  const client = useQueryClient()
  const { showToast } = useToast()
  const id = useId()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const rejecting = action === 'reject'

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['admin', 'properties'] }),
      client.invalidateQueries({ queryKey: ['properties'] }),
      client.invalidateQueries({ queryKey: ['users'] }),
    ])
  }

  async function confirm() {
    if (!action || locked.current || (rejecting && (!reason.trim() || reason.length > 300))) return
    locked.current = true
    setBusy(true)
    try {
      if (rejecting) await rejectProperty(propertyId, reason.trim())
      else await approveProperty(propertyId)
      setAction(null)
      showToast(rejecting ? 'تم رفض الإعلان' : 'تمت الموافقة على الإعلان')
      onSuccess?.()
      await refresh()
    } catch (cause) {
      if (cause instanceof ApiError && [400, 409].includes(cause.status)) {
        setAction(null)
        showToast('تمت مراجعة الإعلان بالفعل، جارٍ تحديث القائمة')
        await refresh()
      } else {
        showToast(cause instanceof ApiError ? cause.message : 'تعذر تنفيذ الإجراء، حاول مرة أخرى')
      }
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  return (
    <section aria-label="مراجعة الإعلان" className="relative flex flex-wrap gap-3">
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => {
          setReason('')
          setAction('reject')
        }}
      >
        رفض
      </Button>
      <Button disabled={busy} onClick={() => setAction('approve')}>
        موافقة
      </Button>
      <ConfirmModal
        open={action !== null}
        title={rejecting ? 'رفض الإعلان' : 'الموافقة على الإعلان'}
        message={
          rejecting ? 'يرجى توضيح سبب رفض الإعلان.' : 'هل تريد الموافقة على نشر هذا الإعلان؟'
        }
        confirmText={rejecting ? 'إرسال' : 'تأكيد الموافقة'}
        tone={rejecting ? 'danger' : 'default'}
        loading={busy}
        confirmDisabled={rejecting && (!reason.trim() || reason.length > 300)}
        onConfirm={() => void confirm()}
        onCancel={() => {
          if (!locked.current) setAction(null)
        }}
      >
        {rejecting && (
          <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-bold">
              سبب الرفض
            </label>
            <textarea
              id={id}
              required
              maxLength={300}
              rows={4}
              disabled={busy}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-describedby={`${id}-counter`}
              className="w-full rounded-md border border-border bg-surface p-3 text-text focus-visible:outline-primary"
            />
            <p id={`${id}-counter`} aria-live="polite" className="text-sm text-text-muted">
              {reason.length}/300
            </p>
          </div>
        )}
      </ConfirmModal>
    </section>
  )
}

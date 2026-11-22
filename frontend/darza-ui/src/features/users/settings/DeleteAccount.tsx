import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError, request } from '../../../api/client'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { useToast } from '../../../components/ui/useToast'
import { useAuth } from '../../../context/auth'

export function DeleteAccount() {
  const { role, logout } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const locked = useRef(false)
  if (role !== 'PUBLISHER') return null

  async function remove() {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(undefined)
    try {
      await request('/api/users/me', { method: 'DELETE' })
      await client.cancelQueries()
      logout()
      client.clear()
      navigate('/', { replace: true })
      showToast('تم حذف الحساب وجميع إعلاناته')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر حذف الحساب، حاول مرة أخرى')
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="delete-account-heading"
      className="space-y-3 rounded-xl border border-danger/30 p-4"
    >
      <h2 id="delete-account-heading" className="font-bold text-danger">
        منطقة الخطر
      </h2>
      <Button
        variant="danger"
        onClick={() => {
          setError(undefined)
          setOpen(true)
        }}
      >
        حذف الحساب
      </Button>
      <ConfirmModal
        open={open}
        title="حذف الحساب"
        tone="danger"
        message="سيتم حذف حسابك وجميع عقاراتك نهائياً. هذا الإجراء غير قابل للتراجع."
        confirmText="حذف الحساب نهائياً"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => {
          if (!locked.current) setOpen(false)
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

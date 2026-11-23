import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError } from '../../api/client'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { FormField } from '../../components/ui/FormField'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'
import { locationSchema, type LocationValues } from './locationSchema'
import { useLocationMutation, type LocationTarget } from './locationMutations'

export function LocationFormModal({ target, onClose }: { target: LocationTarget; onClose: () => void }) {
  const mutation = useLocationMutation()
  const { showToast } = useToast()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema), defaultValues: { name: target.name },
  })
  const submit = handleSubmit(async ({ name }) => {
    if (mutation.isPending) return
    try {
      await mutation.mutateAsync({ target, name })
      showToast('تم حفظ الموقع')
      onClose()
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.fieldErrors?.name || error.fieldErrors?.townName)) {
        setError('name', { message: error.fieldErrors?.name || error.fieldErrors?.townName || error.message })
      } else showToast(error instanceof Error ? error.message : 'تعذر حفظ الموقع')
    }
  })
  return <ConfirmModal open title={`${target.id ? 'تعديل' : 'إضافة'} ${target.kind === 'city' ? 'مدينة' : 'بلدة'}`}
    message="أدخل الاسم" confirmText="حفظ" loading={isSubmitting} onConfirm={() => { void submit() }} onCancel={onClose}>
    <form onSubmit={submit} noValidate>
      <FormField label="الاسم" required error={errors.name?.message}>
        <Input {...register('name')} disabled={isSubmitting} autoFocus />
      </FormField>
      <button type="submit" hidden disabled={isSubmitting}>حفظ</button>
    </form>
  </ConfirmModal>
}

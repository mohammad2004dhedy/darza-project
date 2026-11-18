import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '../api/client'

export function applyApiErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): void {
  if (!(error instanceof ApiError) || !error.fieldErrors) return
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    setError(field as Path<T>, { type: 'server', message })
  }
}

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

/** Maps backend field errors onto known fields; returns the message to show above the form, if any. */
export function resolveSubmitError<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string | null {
  if (!(error instanceof ApiError)) return 'صار خطأ غير متوقع، حاول مرة ثانية'
  let unmatched = false
  let matched = false
  for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
    if (fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: 'server', message })
      matched = true
    } else {
      unmatched = true
    }
  }
  return matched && !unmatched ? null : error.message
}

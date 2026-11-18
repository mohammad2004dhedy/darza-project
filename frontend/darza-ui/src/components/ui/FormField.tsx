import {
  cloneElement,
  forwardRef,
  useId,
  type AriaAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'

interface FieldControlProps extends AriaAttributes {
  id?: string
  required?: boolean
}
export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  children: ReactElement<FieldControlProps>
}
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, required = false, error, hint, children, className = '', ...props },
  ref,
) {
  const generatedId = useId()
  const id = children.props.id ?? generatedId
  const describedBy =
    [
      children.props['aria-describedby'],
      hint ? `${id}-hint` : undefined,
      error ? `${id}-error` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  return (
    <div {...props} ref={ref} className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-bold text-text">
        {label}
        {required && (
          <span className="ms-1 text-danger" aria-label="مطلوب">
            *
          </span>
        )}
      </label>
      {cloneElement(children, {
        id,
        required: required || children.props.required,
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-describedby': describedBy,
      })}
      {hint && (
        <div id={`${id}-hint`} className="text-sm text-text-muted">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

import { forwardRef, type InputHTMLAttributes } from 'react'
import { controlStyles } from './controlStyles'

export type InputProps = InputHTMLAttributes<HTMLInputElement>
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', type = 'text', ...props },
  ref,
) {
  return <input {...props} ref={ref} type={type} className={`${controlStyles} ${className}`} />
})

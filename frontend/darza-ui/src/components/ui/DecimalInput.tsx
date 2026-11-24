import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { Input, type InputProps } from './Input'
import { sanitizeDecimal, type DecimalLimits } from '../../lib/decimal'

interface Props extends Omit<InputProps, 'value' | 'defaultValue' | 'type' | 'inputMode' | 'onChange'>, DecimalLimits {
  value: string
  onChange: (value: string) => void
}

export const DecimalInput = forwardRef<HTMLInputElement, Props>(function DecimalInput(
  { value, onChange, maxIntegerDigits, maxDecimals, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const [hint, setHint] = useState('')
  const hintId = useId()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const clearHint = () => {
    clearTimeout(timer.current)
    setHint('')
  }
  const accept = (text: string) => {
    clearHint()
    onChange(sanitizeDecimal(text, { maxIntegerDigits, maxDecimals }))
  }
  return (
    <>
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        aria-describedby={[describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined}
        onChange={(event) => {
          const text = event.target.value
          const candidate = sanitizeDecimal(text, { maxIntegerDigits: Number.MAX_SAFE_INTEGER, maxDecimals: Number.MAX_SAFE_INTEGER })
          const [whole, fraction = ''] = candidate.split('.')
          const integerOverflow = whole.length > maxIntegerDigits
          const fractionOverflow = fraction.length > maxDecimals || (maxDecimals === 0 && candidate.includes('.'))
          if (integerOverflow || fractionOverflow) {
            clearTimeout(timer.current)
            setHint(integerOverflow ? `حتى ${maxIntegerDigits} خانات قبل الفاصلة` : maxDecimals === 0 ? 'أعداد صحيحة فقط' : 'حتى خانتين بعد الفاصلة فقط')
            timer.current = setTimeout(() => setHint(''), 2000)
            return
          }
          accept(text)
        }}
        onPaste={(event) => {
          event.preventDefault()
          const input = event.currentTarget
          const start = input.selectionStart ?? value.length
          const end = input.selectionEnd ?? start
          accept(value.slice(0, start) + event.clipboardData.getData('text') + value.slice(end))
        }}
      />
      {hint && <p id={hintId} role="status" className="mt-2 text-sm text-text-muted">{hint}</p>}
    </>
  )
})

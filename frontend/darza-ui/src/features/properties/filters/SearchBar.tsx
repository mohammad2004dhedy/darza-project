import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Input } from '../../../components/ui/Input'

export interface SearchBarHandle {
  flush: () => string
}

export function SearchBar({ text, onChange, ref }: {
  text?: string
  onChange: (text: string) => void
  ref?: Ref<SearchBarHandle>
}) {
  const [value, setValue] = useState(text ?? '')
  const [previousText, setPreviousText] = useState(text)
  const submitted = useRef<string | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  if (text !== previousText) {
    setPreviousText(text)
    if (text !== submitted.current) {
      clearTimeout(timer.current)
      timer.current = undefined
      setValue(text ?? '')
    }
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  const flush = () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current)
      timer.current = undefined
      submitted.current = value.trim() || undefined
      onChangeRef.current(value)
    }
    return value
  }
  useImperativeHandle(ref, () => ({ flush }))
  return (
    <Input
      type="search"
      aria-label="البحث عن عقار"
      placeholder="ابحث عن عقار"
      maxLength={100}
      value={value}
      className="min-w-0 flex-1"
      onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); flush() }
      }}
      onChange={(event) => {
        const next = event.target.value
        setValue(next)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          timer.current = undefined
          submitted.current = next.trim() || undefined
          onChangeRef.current(next)
        }, 400)
      }}
    />
  )
}

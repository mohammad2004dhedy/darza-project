import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { Input } from '../../../components/ui/Input'

export interface SearchBarHandle {
  flush: () => string
}

export function SearchBar({ text, onChange, ref }: {
  text?: string
  onChange: (text: string) => void
  ref?: Ref<SearchBarHandle>
}) {
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => {
    clearTimeout(timer.current)
    if (input.current) input.current.value = text ?? ''
  }, [text])
  useEffect(() => () => clearTimeout(timer.current), [])
  useImperativeHandle(ref, () => ({
    flush: () => {
      clearTimeout(timer.current)
      const value = input.current?.value ?? ''
      if (input.current) input.current.value = text ?? ''
      return value
    },
  }), [text])
  return (
    <Input
      ref={input}
      type="search"
      aria-label="البحث عن عقار"
      placeholder="ابحث عن عقار"
      maxLength={100}
      defaultValue={text ?? ''}
      className="min-w-0 flex-1"
      onChange={(event) => {
        const next = event.target.value
        clearTimeout(timer.current)
        timer.current = setTimeout(() => onChangeRef.current(next), 400)
      }}
    />
  )
}

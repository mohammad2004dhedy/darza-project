import { useEffect, useRef, useState } from 'react'
import { Input } from '../../../components/ui/Input'

export function SearchBar({ text, onChange }: { text?: string; onChange: (text: string) => void }) {
  const [value, setValue] = useState(text ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Input
      type="search"
      aria-label="البحث عن عقار"
      placeholder="ابحث عن عقار"
      maxLength={100}
      value={value}
      className="min-w-0 flex-1"
      onChange={(event) => {
        const next = event.target.value
        setValue(next)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => onChange(next), 400)
      }}
    />
  )
}

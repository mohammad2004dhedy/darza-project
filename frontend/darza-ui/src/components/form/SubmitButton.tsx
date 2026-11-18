import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface SubmitButtonProps {
  loading: boolean
  children: ReactNode
}
export function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" fullWidth loading={loading}>
      {children}
    </Button>
  )
}

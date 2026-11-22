import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from './Button'

export function BackButton() {
  const navigate = useNavigate()
  return (
    <Button variant="outline" onClick={() => navigate(-1)}>
      <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
      رجوع
    </Button>
  )
}

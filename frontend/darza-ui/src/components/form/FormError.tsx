import { ErrorMessage } from '../ui/ErrorMessage'

interface FormErrorProps {
  message?: string | null
}
export function FormError({ message }: FormErrorProps) {
  if (!message) return null
  return <ErrorMessage message={message} />
}

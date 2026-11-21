import { ErrorMessage } from '../../../components/ui/ErrorMessage'

export function ProfileError({ onRetry }: { onRetry: () => void }) {
  return <ErrorMessage message="تعذر تحميل الملف الشخصي" onRetry={onRetry} />
}

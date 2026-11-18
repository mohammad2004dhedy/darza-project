import { ApiError } from '../../../api/client'
import { ErrorMessage } from '../../../components/ui/ErrorMessage'

export function FeedErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <ErrorMessage
      message={error instanceof ApiError ? error.message : 'تعذّر تحميل العقارات'}
      onRetry={onRetry}
    />
  )
}

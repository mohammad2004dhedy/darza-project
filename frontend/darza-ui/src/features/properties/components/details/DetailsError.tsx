import { Button } from '../../../../components/ui/Button'
export function DetailsError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="space-y-4 py-16 text-center">
      <h1 className="text-xl font-bold">تعذر تحميل الإعلان</h1>
      <Button onClick={onRetry}>حاول مرة أخرى</Button>
    </section>
  )
}

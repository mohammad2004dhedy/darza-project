import { useToast } from '../../components/ui/useToast'

export function useShareProperty(id: number, title: string, townName: string, cityName: string) {
  const toast = useToast()
  return async () => {
    const url = `${window.location.origin}/properties/${id}`
    const canShare = typeof navigator.share === 'function'
    try {
      if (canShare)
        await navigator.share({ title, text: `${title} - ${townName}، ${cityName}`, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.showToast('تم نسخ الرابط')
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        toast.showToast(canShare ? 'تعذرت مشاركة الرابط' : 'تعذر نسخ الرابط')
    }
  }
}

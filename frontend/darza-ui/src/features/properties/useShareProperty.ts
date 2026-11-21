import { useToast } from '../../components/ui/useToast'

export function useShareProperty(id: number, title: string) {
  const toast = useToast()
  return async () => {
    const url = `${window.location.origin}/properties/${id}`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.showToast('تم نسخ رابط الإعلان')
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        toast.showToast('تعذرت مشاركة الرابط، حاول مرة أخرى')
    }
  }
}

import { ButtonLink } from '../../../components/ui/ButtonLink'

export function ProfileNotFound() {
  return (
    <section className="space-y-4 py-12 text-center">
      <h1 className="text-2xl font-bold">الملف الشخصي غير موجود</h1>
      <p className="text-text-muted">لم نتمكن من العثور على هذا المستخدم.</p>
      <ButtonLink to="/" className="transition-none">
        العودة للرئيسية
      </ButtonLink>
    </section>
  )
}

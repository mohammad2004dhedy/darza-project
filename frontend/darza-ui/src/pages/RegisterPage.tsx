import { AuthCard } from '../features/auth/components/AuthCard'
import { RegisterForm } from '../features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthCard
      title="إنشاء حساب"
      subtitle="سجّل وابدأ انشر عقاراتك"
      footerText="عندك حساب؟"
      footerLinkLabel="سجّل دخول"
      footerLinkTo="/login"
    >
      <RegisterForm />
    </AuthCard>
  )
}

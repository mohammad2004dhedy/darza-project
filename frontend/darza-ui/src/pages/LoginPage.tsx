import { AuthCard } from '../features/auth/components/AuthCard'
import { LoginForm } from '../features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="أهلا فيك من جديد"
      footerText="ما عندك حساب؟"
      footerLinkLabel="أنشئ حساب"
      footerLinkTo="/register"
    >
      <LoginForm />
    </AuthCard>
  )
}

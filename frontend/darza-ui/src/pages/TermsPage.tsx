import { StaticPage } from '../components/ui/StaticPage'
import { termsContent } from '../content/terms'

export default function TermsPage() {
  return <StaticPage title="شروط الاستخدام" sections={termsContent} />
}

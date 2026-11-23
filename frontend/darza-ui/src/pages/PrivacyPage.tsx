import { StaticPage } from '../components/ui/StaticPage'
import { privacyContent } from '../content/privacy'

export default function PrivacyPage() {
  return <StaticPage title="سياسة الخصوصية" sections={privacyContent} />
}

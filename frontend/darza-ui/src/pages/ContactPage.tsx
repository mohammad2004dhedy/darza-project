import { StaticPage } from '../components/ui/StaticPage'
import { contactContent } from '../content/contact'

export default function ContactPage() {
  return <StaticPage title="تواصل معنا" sections={contactContent} />
}

import { StaticPage } from '../components/ui/StaticPage'
import { aboutContent } from '../content/about'

export default function AboutPage() {
  return <StaticPage title="عن درزة" sections={aboutContent} />
}

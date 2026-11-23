import {
  siteName,
  lastUpdated,
  supportEmail,
  supportWhatsapp,
  supportContactsArePlaceholders,
} from '../../config/siteConfig'
import type { StaticSection } from '../../content/types'
import { toWhatsAppUrl } from '../../lib/phone'
import { BackButton } from './BackButton'

const contactClasses =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary ps-4 pe-4 py-2 font-bold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:opacity-50'

function ContactActions() {
  const whatsappUrl = toWhatsAppUrl(supportWhatsapp)
  const disabled = supportContactsArePlaceholders
  return (
    <div className="flex flex-wrap gap-3">
      <a
        className={contactClasses}
        href={disabled ? undefined : `mailto:${supportEmail}`}
        role="link"
        aria-disabled={disabled}
      >
        البريد الإلكتروني
      </a>
      <a
        className={contactClasses}
        href={disabled ? undefined : (whatsappUrl ?? undefined)}
        role="link"
        aria-disabled={disabled || !whatsappUrl}
      >
        واتساب
      </a>
    </div>
  )
}

export function StaticPage({ title, sections }: { title: string; sections: StaticSection[] }) {
  return (
    <article dir="rtl" className="max-w-prose space-y-8 text-start leading-loose">
      <title>{`${title} | ${siteName}`}</title>
      <BackButton />
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm">
          آخر تحديث: <time dateTime={lastUpdated}>{lastUpdated}</time>
        </p>
      </header>
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-bold">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets && (
            <ul className="list-disc space-y-2 ps-6">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          {section.contactActions && <ContactActions />}
        </section>
      ))}
    </article>
  )
}

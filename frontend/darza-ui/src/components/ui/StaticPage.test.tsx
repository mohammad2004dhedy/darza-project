// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StaticPage } from './StaticPage'
import { privacyContent } from '../../content/privacy'
import { termsContent } from '../../content/terms'
import { aboutContent } from '../../content/about'
import { contactContent } from '../../content/contact'
import { preliminaryLegalNotice } from '../../content/legalNotice'
import { lastUpdated, siteName } from '../../config/siteConfig'

afterEach(cleanup)

for (const [title, sections] of [
  ['سياسة الخصوصية', privacyContent],
  ['شروط الاستخدام', termsContent],
  ['عن درزة', aboutContent],
  ['تواصل معنا', contactContent],
] as const) {
  it(`renders ${title} sections exactly once`, () => {
    render(
      <MemoryRouter>
        <StaticPage title={title} sections={sections} />
      </MemoryRouter>,
    )
    expect(document.title).toBe(`${title} | ${siteName}`)
    expect(screen.getByRole('button', { name: 'رجوع' })).toBeTruthy()
    expect(screen.getByText(lastUpdated)).toBeTruthy()
    for (const section of sections) {
      expect(screen.getAllByRole('heading', { name: section.heading, level: 2 })).toHaveLength(1)
      for (const paragraph of section.paragraphs ?? [])
        expect(screen.getAllByText(paragraph)).toHaveLength(1)
      for (const bullet of section.bullets ?? [])
        expect(screen.getAllByText(bullet)).toHaveLength(1)
    }
    if (sections === privacyContent || sections === termsContent) {
      expect(screen.getAllByText(preliminaryLegalNotice)).toHaveLength(1)
    }
    if (sections === contactContent) {
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      for (const link of links) {
        expect(link.getAttribute('aria-disabled')).toBe('false')
        expect(link.hasAttribute('href')).toBe(true)
      }
      expect(screen.getByRole('link', { name: 'البريد الإلكتروني' }).getAttribute('href')).toBe(
        'mailto:mohammed.dhedy@gmail.com',
      )
      expect(screen.getByRole('link', { name: 'واتساب' }).getAttribute('href')).toBe(
        'https://wa.me/972598154860',
      )
      expect(document.querySelector('form')).toBeNull()
    }
  })
}

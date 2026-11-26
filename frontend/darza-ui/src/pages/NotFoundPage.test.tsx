// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage'

afterEach(cleanup)

it('shows a real not-found message, illustration, and link back to the feed', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('مش موجودة')
  expect(screen.getByRole('img').getAttribute('src')).toBe('/images/lost-deer.png')
  expect(screen.getByRole('link', { name: /الرجوع للصفحة الرئيسية/ }).getAttribute('href')).toBe(
    '/',
  )
  expect(screen.queryByText(/قيد التجهيز/)).toBeNull()
})

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Spinner } from './Spinner'

afterEach(cleanup)

it('provides accessible loading feedback and continuous rotation', () => {
  render(<Spinner />)
  const status = screen.getByRole('status')
  expect(status.textContent).toBe('جاري التحميل')
  const ring = status.querySelector('[aria-hidden="true"]')!
  expect(ring.classList.contains('animate-spin')).toBe(true)
  expect(ring.classList.contains('motion-reduce:[animation-duration:1.5s]')).toBe(true)
  expect(ring.classList.contains('size-4')).toBe(true)
})

it('supports a custom label and size', () => {
  render(<Spinner size="lg" label="تحميل المزيد" />)
  const status = screen.getByRole('status')
  expect(status.textContent).toBe('تحميل المزيد')
  expect(status.querySelector('.size-8')).toBeTruthy()
})

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ProfileAvatar } from './ProfileAvatar'

afterEach(cleanup)

it('uses a fixed-size eager image above the fold', () => {
  render(<ProfileAvatar displayName="أحمد" profileImageUrl="/avatar.jpg" />)
  const image = screen.getByRole('img', { name: 'أحمد' })
  expect(image.getAttribute('loading')).toBe('eager')
  expect(image.getAttribute('width')).toBe('96')
  expect(image.getAttribute('height')).toBe('96')
})

it('falls back to the first letter for missing and failed images, and recovers for a new URL', () => {
  const { rerender } = render(<ProfileAvatar displayName=" أحمد" />)
  expect(screen.getByText('أ')).toBeTruthy()
  rerender(<ProfileAvatar displayName="أحمد" profileImageUrl="/broken.jpg" />)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.getByText('أ')).toBeTruthy()
  rerender(<ProfileAvatar displayName="أحمد" profileImageUrl="/new.jpg" />)
  expect(screen.getByRole('img').getAttribute('src')).toBe('/new.jpg')
})

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ImageWithPlaceholder } from './ImageWithPlaceholder'

afterEach(cleanup)

it('keeps a static placeholder until load without changing the frame', () => {
  const { container } = render(
    <ImageWithPlaceholder
      src="/photo.jpg"
      alt="Photo"
      loading="lazy"
      containerClassName="aspect-[4/3]"
    />,
  )
  const image = screen.getByRole('img')
  const frame = container.firstElementChild!
  expect(frame.className).toContain('aspect-[4/3]')
  expect(frame.className).toContain('bg-background')
  expect(frame.querySelector('svg')).toBeTruthy()
  expect(image.className).toContain('opacity-0')
  expect(image.getAttribute('decoding')).toBe('async')
  expect(image.getAttribute('loading')).toBe('lazy')
  fireEvent.load(image)
  expect(frame.querySelector('svg')).toBeNull()
  expect(image.className).not.toContain('opacity-0')
  expect(container.firstElementChild).toBe(frame)
})

it('retains the placeholder on error and resets for each source', () => {
  const { container, rerender } = render(
    <ImageWithPlaceholder src="/broken.jpg" alt="Photo" containerClassName="size-24" />,
  )
  fireEvent.error(screen.getByRole('img'))
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).toBeTruthy()
  rerender(<ImageWithPlaceholder src="/new.jpg" alt="Photo" containerClassName="size-24" />)
  const image = screen.getByRole('img')
  expect(image.className).toContain('opacity-0')
  fireEvent.load(image)
  expect(container.querySelector('svg')).toBeNull()
  rerender(<ImageWithPlaceholder src="/third.jpg" alt="Photo" containerClassName="size-24" />)
  expect(container.querySelector('svg')).toBeTruthy()
  expect(screen.getByRole('img').className).toContain('opacity-0')
})

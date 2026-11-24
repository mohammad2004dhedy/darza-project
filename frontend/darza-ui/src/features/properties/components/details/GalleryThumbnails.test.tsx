// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { GalleryThumbnails } from './GalleryThumbnails'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('reveals the selected thumbnail with container scrollTo only', () => {
  const images = Array.from({ length: 4 }, (_, index) => ({ path: `${index}`, url: `/photo-${index}.jpg` }))
  const onSelect = vi.fn()
  const scrollTo = vi.fn()
  const scrollIntoView = vi.fn()
  const { rerender } = render(<GalleryThumbnails images={images} title="منزل" index={0} onSelect={onSelect} />)
  const strip = screen.getByLabelText('الصور المصغرة')
  strip.scrollTo = scrollTo
  strip.scrollIntoView = scrollIntoView
  vi.spyOn(strip, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 200 } as DOMRect)
  const thumbnail = screen.getByRole('button', { name: 'عرض الصورة 4' })
  thumbnail.scrollIntoView = scrollIntoView
  vi.spyOn(thumbnail, 'getBoundingClientRect').mockReturnValue({ left: 240, right: 320 } as DOMRect)
  fireEvent.click(thumbnail)
  expect(onSelect).toHaveBeenCalledWith(3)
  rerender(<GalleryThumbnails images={images} title="منزل" index={3} onSelect={onSelect} />)
  expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 120, behavior: 'instant' })
  expect(scrollIntoView).not.toHaveBeenCalled()
})

// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePropertyGallery } from './usePropertyGallery'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function setup(rtl = false, initialIndex = 0) {
  const element = document.createElement('div')
  for (let index = 0; index < 4; index++) {
    const slide = document.createElement('div')
    Object.defineProperty(slide, 'offsetLeft', { value: index * 100 * (rtl ? -1 : 1) })
    element.append(slide)
  }
  element.scrollTo = vi.fn()
  const mounted = renderHook(() => {
    const result = usePropertyGallery(4, initialIndex)
    result.track.current = element
    return result
  })
  return { ...mounted, element }
}

it('highlights the target immediately and ignores intermediate positions until idle', () => {
  const { result, element } = setup()
  act(() => result.current.goTo(3))
  expect(result.current.activeIndex).toBe(3)
  for (const left of [0, 100, 200]) {
    act(() => {
      element.scrollLeft = left
      result.current.onScroll()
      vi.advanceTimersByTime(100)
    })
    expect(result.current.activeIndex).toBe(3)
  }
  act(() => {
    element.scrollLeft = 300
    result.current.onScroll()
    vi.advanceTimersByTime(300)
  })
  expect(result.current.activeIndex).toBe(3)
  act(() => {
    element.scrollLeft = 100
    result.current.onScroll()
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(1)
})

it('releases on scrollend and calculates user scrolling with negative RTL offsets', () => {
  const { result, element } = setup(true)
  act(() => result.current.goTo(3))
  expect(element.scrollTo).toHaveBeenCalledWith({ left: -300, behavior: 'auto' })
  act(() => {
    element.scrollLeft = -300
    element.dispatchEvent(new Event('scrollend'))
    element.scrollLeft = -200
    result.current.onScroll()
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(2)
})

it('keeps the most recent target during rapid navigation and cancels queued user settlement', () => {
  const { result, element } = setup()
  act(() => {
    result.current.onScroll()
    result.current.goTo(1)
    result.current.goTo(3)
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(3)
  act(() => {
    element.scrollLeft = 300
    element.dispatchEvent(new Event('scrollend'))
  })
  expect(result.current.activeIndex).toBe(3)
})

it('ignores stale scrollend at the old slide and holds the target until its scrollend', () => {
  const { result, element } = setup()
  act(() => result.current.goTo(1))
  expect(result.current.activeIndex).toBe(1)
  act(() => {
    element.dispatchEvent(new Event('scrollend'))
    result.current.onScroll()
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(1)
  act(() => {
    element.scrollLeft = 100
    element.dispatchEvent(new Event('scrollend'))
    element.scrollLeft = 200
    result.current.onScroll()
    vi.advanceTimersByTime(119)
  })
  expect(result.current.activeIndex).toBe(1)
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.activeIndex).toBe(2)
})

it('releases the programmatic lock after 400ms even without scrollend', () => {
  const { result, element } = setup()
  act(() => result.current.goTo(2))
  act(() => {
    element.scrollLeft = 0
    result.current.onScroll()
    vi.advanceTimersByTime(399)
  })
  expect(result.current.activeIndex).toBe(2)
  act(() => {
    vi.advanceTimersByTime(1)
    result.current.onScroll()
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(0)
})

it('updates user scrolling only after the last event settles or scrollend', () => {
  const { result, element } = setup()
  act(() => {
    element.scrollLeft = 100
    result.current.onScroll()
    vi.advanceTimersByTime(100)
    element.scrollLeft = 200
    result.current.onScroll()
    vi.advanceTimersByTime(119)
  })
  expect(result.current.activeIndex).toBe(0)
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.activeIndex).toBe(2)
  act(() => {
    element.scrollLeft = 300
    result.current.onScroll()
    element.dispatchEvent(new Event('scrollend'))
  })
  expect(result.current.activeIndex).toBe(3)
})

it('starts the viewer at its initial index and holds an instant target through stale events', () => {
  const { result, element } = setup(false, 2)
  expect(result.current.activeIndex).toBe(2)
  act(() => result.current.goTo(2, 'instant'))
  expect(element.scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'instant' })
  act(() => {
    element.scrollLeft = 100
    result.current.onScroll()
    element.dispatchEvent(new Event('scrollend'))
    vi.advanceTimersByTime(120)
  })
  expect(result.current.activeIndex).toBe(2)
})

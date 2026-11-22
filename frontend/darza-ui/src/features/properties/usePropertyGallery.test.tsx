// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePropertyGallery } from './usePropertyGallery'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16))
  vi.stubGlobal('cancelAnimationFrame', clearTimeout)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function setup(rtl = false) {
  const element = document.createElement('div')
  for (let index = 0; index < 4; index++) {
    const slide = document.createElement('div')
    Object.defineProperty(slide, 'offsetLeft', { value: index * 100 * (rtl ? -1 : 1) })
    element.append(slide)
  }
  element.scrollTo = vi.fn()
  const mounted = renderHook(() => {
    const result = usePropertyGallery(4)
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
    vi.advanceTimersByTime(16)
  })
  expect(result.current.activeIndex).toBe(1)
})

it('releases on scrollend and calculates user scrolling with negative RTL offsets', () => {
  const { result, element } = setup(true)
  act(() => result.current.goTo(3))
  expect(element.scrollTo).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' })
  act(() => {
    element.scrollLeft = -300
    element.dispatchEvent(new Event('scrollend'))
    element.scrollLeft = -200
    result.current.onScroll()
    vi.advanceTimersByTime(16)
  })
  expect(result.current.activeIndex).toBe(2)
})

it('keeps the most recent target during rapid navigation and cancels queued user frames', () => {
  const { result, element } = setup()
  act(() => {
    result.current.onScroll()
    result.current.goTo(1)
    result.current.goTo(3)
    vi.advanceTimersByTime(16)
  })
  expect(result.current.activeIndex).toBe(3)
  act(() => {
    element.scrollLeft = 300
    element.dispatchEvent(new Event('scrollend'))
  })
  expect(result.current.activeIndex).toBe(3)
})

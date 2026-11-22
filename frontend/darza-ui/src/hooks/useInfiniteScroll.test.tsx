// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import type { PropsWithChildren, Ref } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from './useInfiniteScroll'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  readonly callback: IntersectionObserverCallback
  readonly options?: IntersectionObserverInit

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
    MockIntersectionObserver.instances.push(this)
  }

  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function Harness({
  enabled,
  onLoad,
  sentinelRef,
}: PropsWithChildren<{
  enabled: boolean
  onLoad: () => void
  sentinelRef?: Ref<HTMLDivElement>
}>) {
  const { sentinelRef: hookRef } = useInfiniteScroll(enabled, onLoad)
  return <div data-testid="sentinel" ref={sentinelRef ?? hookRef} />
}

describe('useInfiniteScroll', () => {
  it('preloads, prevents duplicate calls while intersecting, and permits re-entry', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    MockIntersectionObserver.instances = []
    const onLoad = vi.fn()
    render(<Harness enabled onLoad={onLoad} />)

    const observer = MockIntersectionObserver.instances[0]
    const sentinel = screen.getByTestId('sentinel')
    expect(observer.options?.rootMargin).toBe('600px 0px')
    expect(observer.observe).toHaveBeenCalledWith(sentinel)

    observer.trigger(sentinel, true)
    observer.trigger(sentinel, true)
    expect(onLoad).toHaveBeenCalledTimes(1)

    observer.trigger(sentinel, false)
    observer.trigger(sentinel, true)
    expect(onLoad).toHaveBeenCalledTimes(2)
  })

  it('does not observe while disabled and disconnects on unmount', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    MockIntersectionObserver.instances = []
    const onLoad = vi.fn()
    const { rerender, unmount } = render(<Harness enabled={false} onLoad={onLoad} />)

    expect(MockIntersectionObserver.instances).toHaveLength(0)
    rerender(<Harness enabled onLoad={onLoad} />)
    const observer = MockIntersectionObserver.instances[0]
    expect(observer.observe).toHaveBeenCalledTimes(1)
    unmount()
    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })
})

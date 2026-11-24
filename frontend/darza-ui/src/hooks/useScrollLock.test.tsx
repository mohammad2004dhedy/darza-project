// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import { readFileSync } from 'node:fs'
import { useScrollLock } from './useScrollLock'
import { OverlayRouteCleanup } from '../components/ui/OverlayRouteCleanup'

afterEach(cleanup)
const locked = () => document.documentElement.classList.contains('scroll-locked')
function Lock({ active }: { active: boolean }) {
  useScrollLock(active)
  return null
}
function Navigate() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/next')}>Navigate</button>
}

it('increments and decrements with activation and supports repeated cycles', () => {
  const view = render(<MemoryRouter><Lock active={false} /></MemoryRouter>)
  expect(locked()).toBe(false)
  for (let cycle = 0; cycle < 2; cycle += 1) {
    view.rerender(<MemoryRouter><Lock active /></MemoryRouter>)
    expect(locked()).toBe(true)
    view.rerender(<MemoryRouter><Lock active={false} /></MemoryRouter>)
    expect(locked()).toBe(false)
  }
})

it('keeps nested overlays locked until the last owner releases', () => {
  const view = render(<MemoryRouter><Lock active /><Lock active /></MemoryRouter>)
  view.rerender(<MemoryRouter><Lock active={false} /><Lock active /></MemoryRouter>)
  expect(locked()).toBe(true)
  view.rerender(<MemoryRouter><Lock active={false} /><Lock active={false} /></MemoryRouter>)
  expect(locked()).toBe(false)
})

it('releases on unmount while open, including StrictMode rehearsal', () => {
  const view = render(<StrictMode><MemoryRouter><Lock active /></MemoryRouter></StrictMode>)
  expect(locked()).toBe(true)
  view.unmount()
  expect(locked()).toBe(false)
})

it('releases all owners on route changes without underflowing on unmount', () => {
  const view = render(<MemoryRouter><Lock active /><Lock active /><Navigate /></MemoryRouter>)
  fireEvent.click(screen.getByText('Navigate'))
  expect(locked()).toBe(false)
  view.unmount()
  const next = render(<MemoryRouter><Lock active /></MemoryRouter>)
  expect(locked()).toBe(true)
  next.unmount()
  expect(locked()).toBe(false)
})

it('cancels and closes persistent native dialogs on navigation', () => {
  const cancel = vi.fn()
  const view = render(<MemoryRouter><OverlayRouteCleanup /><dialog open onCancel={cancel} /><Navigate /></MemoryRouter>)
  const dialog = view.container.querySelector('dialog')!
  dialog.close = () => dialog.removeAttribute('open')
  fireEvent.click(screen.getByText('Navigate'))
  expect(cancel).toHaveBeenCalledOnce()
  expect(dialog.open).toBe(false)
})

it('shares the CSS lock and permanently reserves scrollbar space', () => {
  const css = readFileSync('src/index.css', 'utf8')
  expect(css).toMatch(/html\s*\{\s*scrollbar-gutter: stable;/)
  expect(css).toMatch(/html:has\(dialog\[open\]\),\s*html.scroll-locked\s*\{\s*overflow: hidden;\s*scrollbar-gutter: stable;/)
  expect(css).toMatch(/dialog,\s*dialog \*\s*\{\s*overscroll-behavior: contain;/)
})

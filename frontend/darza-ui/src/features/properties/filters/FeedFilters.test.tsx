// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { FeedFilters } from './FeedFilters'
import type { PropertyFilters } from './model'

vi.mock('./FilterBadges', () => ({ FilterBadges: () => null }))
vi.mock('./FilterModal', () => ({
  default: ({ filters, onApply }: { filters: PropertyFilters; onApply: (filters: PropertyFilters) => void }) => (
    <button onClick={() => onApply({ ...filters, propertyType: 'HOUSE' })}>تطبيق</button>
  ),
}))

afterEach(() => { cleanup(); vi.useRealTimers() })

it('keeps the input mounted and focused after debouncing and restores URL text', () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { rerender } = render(<FeedFilters filters={{}} onChange={onChange} />)
  const input = screen.getByRole('searchbox') as HTMLInputElement
  input.focus()
  fireEvent.change(input, { target: { value: 'شقة' } })
  act(() => vi.advanceTimersByTime(400))
  expect(onChange).toHaveBeenLastCalledWith({ text: 'شقة' }, true)
  rerender(<FeedFilters filters={{ text: 'شقة' }} onChange={onChange} />)
  expect(screen.getByRole('searchbox')).toBe(input)
  expect(document.activeElement).toBe(input)
  rerender(<FeedFilters filters={{ text: 'منزل' }} onChange={onChange} />)
  expect(input.value).toBe('منزل')
})

it.each([false, true])('preserves search on modal Apply when debounce already fired: %s', async (elapsed) => {
  const onChange = vi.fn()
  const { rerender } = render(<FeedFilters filters={{}} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'الفلاتر' }))
  await screen.findByRole('button', { name: 'تطبيق' })
  vi.useFakeTimers()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'فيلا' } })
  if (elapsed) {
    act(() => vi.advanceTimersByTime(400))
    rerender(<FeedFilters filters={{ text: 'فيلا' }} onChange={onChange} />)
  }
  fireEvent.click(screen.getByRole('button', { name: 'تطبيق' }))
  expect(onChange).toHaveBeenLastCalledWith({ propertyType: 'HOUSE', text: 'فيلا' })
  const calls = onChange.mock.calls.length
  act(() => vi.advanceTimersByTime(400))
  expect(onChange).toHaveBeenCalledTimes(calls)
})

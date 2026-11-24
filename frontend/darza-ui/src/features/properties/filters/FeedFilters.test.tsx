// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { FeedFilters } from './FeedFilters'
import type { PropertyFilters } from './model'

vi.mock('../../location/hooks', () => ({
  useCities: () => ({ data: [] }),
  useTowns: () => ({ data: [] }),
}))
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

function SyncedFilters() {
  const [filters, setFilters] = useState<PropertyFilters>({})
  return <FeedFilters filters={filters} onChange={setFilters} />
}

it('keeps focus and caret through a URL acknowledgement using userEvent', async () => {
  const user = userEvent.setup()
  render(<SyncedFilters />)
  const input = screen.getByRole('searchbox') as HTMLInputElement
  await user.type(input, 'house ')
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
  expect(screen.getByRole('searchbox')).toBe(input)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('house ')
  expect(input.selectionStart).toBe(6)
})

it('flushes on opening and preserves typing after opening on Apply', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<FeedFilters filters={{}} onChange={onChange} />)
  await user.type(screen.getByRole('searchbox'), 'new')
  await user.click(screen.getByRole('button', { name: 'الفلاتر' }))
  expect(onChange).toHaveBeenLastCalledWith({ text: 'new' }, true)
  await screen.findByRole('button', { name: 'تطبيق' })
  await user.type(screen.getByRole('searchbox'), ' text')
  await user.click(screen.getByRole('button', { name: 'تطبيق' }))
  expect(onChange).toHaveBeenLastCalledWith({ propertyType: 'HOUSE', text: 'new text' })
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('new text')
})

it('flushes immediately on Enter without another debounce update', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<FeedFilters filters={{}} onChange={onChange} />)
  await user.type(screen.getByRole('searchbox'), 'house{Enter}')
  expect(onChange).toHaveBeenLastCalledWith({ text: 'house' }, true)
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
  expect(onChange).toHaveBeenCalledTimes(1)
})

it('does not overwrite newer typing when an earlier URL update arrives', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  const { rerender } = render(<FeedFilters filters={{}} onChange={onChange} />)
  const input = screen.getByRole('searchbox') as HTMLInputElement
  await user.type(input, 'old')
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
  await user.type(input, ' newer')
  rerender(<FeedFilters filters={{ text: 'old' }} onChange={onChange} />)
  expect(input.value).toBe('old newer')
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)) })
  expect(onChange).toHaveBeenLastCalledWith({ text: 'old newer' }, true)
})


it('keeps search, filters and clear-all together above a full-width badges-only row', () => {
  const onChange = vi.fn()
  render(<FeedFilters filters={{ text: 'شقة', propertyType: 'HOUSE' }} onChange={onChange} />)
  const search = screen.getByRole('searchbox')
  const filtersButton = screen.getByRole('button', { name: 'الفلاتر' })
  const clear = screen.getByRole('button', { name: 'مسح الكل' })
  const row = filtersButton.parentElement!
  expect(row.contains(search)).toBe(true)
  expect(clear.parentElement).toBe(row)
  const badges = screen.getByLabelText('الفلاتر المطبقة')
  expect(row.nextElementSibling).toBe(badges)
  expect(badges.classList.contains('w-full')).toBe(true)
  expect(badges.classList.contains('flex-wrap')).toBe(true)
  expect(within(badges).getAllByRole('button')).toHaveLength(2)
  expect(within(badges).queryByRole('button', { name: 'مسح الكل' })).toBeNull()
  fireEvent.click(within(badges).getByRole('button', { name: 'إزالة منزل' }))
  expect(onChange).toHaveBeenLastCalledWith({ text: 'شقة' })
  fireEvent.click(within(badges).getByRole('button', { name: 'إزالة شقة' }))
  expect(onChange).toHaveBeenLastCalledWith({ propertyType: 'HOUSE' })
})

it('shows clear-all only for active filters and clears pending search without restoring it', () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { rerender } = render(<FeedFilters filters={{}} onChange={onChange} />)
  expect(screen.queryByRole('button', { name: 'مسح الكل' })).toBeNull()
  expect(screen.queryByLabelText('الفلاتر المطبقة')).toBeNull()
  rerender(<FeedFilters filters={{ propertyType: 'HOUSE' }} onChange={onChange} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'pending' } })
  fireEvent.click(screen.getByRole('button', { name: 'مسح الكل' }))
  expect(onChange).toHaveBeenLastCalledWith({})
  const calls = onChange.mock.calls.length
  act(() => vi.advanceTimersByTime(400))
  expect(onChange).toHaveBeenCalledTimes(calls)
  rerender(<FeedFilters filters={{}} onChange={onChange} />)
  expect(screen.queryByRole('button', { name: 'مسح الكل' })).toBeNull()
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('')
})

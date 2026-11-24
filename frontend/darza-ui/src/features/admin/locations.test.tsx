// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, renderHook, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ToastContext } from '../../components/ui/ToastContext'
import { request } from '../../api/client'
import { LocationFormModal } from './LocationFormModal'
import { useLocationMutation } from './locationMutations'
import { MemoryRouter } from 'react-router'
import { LocationManagement } from './LocationManagement'

vi.mock('../../api/client', async importOriginal => ({
  ...await importOriginal<typeof import('../../api/client')>(),
  request: vi.fn().mockResolvedValue(undefined),
}))
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(() => { cleanup(); vi.clearAllMocks() })
function setup() {
  const client = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><ToastContext.Provider value={{ showToast: vi.fn() }}>{children}</ToastContext.Provider></QueryClientProvider>
  return { client, wrapper }
}
it.each(['', '   ', 'a'.repeat(101)])('rejects invalid name %j', async name => {
  const { wrapper } = setup()
  render(<LocationFormModal target={{ kind: 'city', name: '' }} onClose={vi.fn()} />, { wrapper })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
  expect(request).not.toHaveBeenCalled()
})
it('trims submitted names', async () => {
  const { wrapper } = setup()
  render(<LocationFormModal target={{ kind: 'city', name: '' }} onClose={vi.fn()} />, { wrapper })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '  نابلس  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith('/api/admin/location/city', expect.objectContaining({ body: JSON.stringify({ name: 'نابلس' }) })))
})
it.each([false, true])('invalidates locations after create/delete remove=%s', async remove => {
  const { client, wrapper } = setup()
  client.setQueryData(['cities'], [])
  client.setQueryData(['towns', 1], [])
  client.setQueryData(['towns', 2], [])
  const { result } = renderHook(() => useLocationMutation(), { wrapper })
  await act(() => result.current.mutateAsync({ target: { kind: 'city', name: 'نابلس', ...(remove ? { id: 1 } : {}) }, name: 'نابلس', remove }))
  for (const key of [['cities'], ['towns', 1], ['towns', 2]]) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
})

it('shows location guidance and an empty towns section before selecting a city', () => {
  const { client, wrapper } = setup()
  client.setQueryData(['cities'], [{ id: 1, name: 'نابلس' }, { id: 2, name: 'رام الله' }])
  render(<MemoryRouter><LocationManagement /></MemoryRouter>, { wrapper })
  expect(screen.getByText('اختر مدينة لعرض بلداتها وإدارتها.')).toBeTruthy()
  expect(screen.getAllByRole('heading', { name: 'البلدات' })).toHaveLength(1)
  expect(screen.getByText('اختر مدينة من الأعلى')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'نابلس' }).closest('li')?.hasAttribute('aria-current')).toBe(false)
})

it('highlights the selected city and updates the towns heading when selection changes', () => {
  const { client, wrapper } = setup()
  client.setQueryData(['cities'], [{ id: 1, name: 'نابلس' }, { id: 2, name: 'رام الله' }])
  client.setQueryData(['towns', 1], [])
  client.setQueryData(['towns', 2], [])
  render(<MemoryRouter initialEntries={['/admin/locations?city=1']}><LocationManagement /></MemoryRouter>, { wrapper })
  const nablus = screen.getByRole('button', { name: 'نابلس' }).closest('li')
  expect(nablus?.getAttribute('aria-current')).toBe('true')
  expect(nablus?.classList.contains('border-primary')).toBe(true)
  expect(nablus?.classList.contains('bg-primary/5')).toBe(true)
  expect(screen.getAllByRole('heading', { name: 'البلدات (نابلس)' })).toHaveLength(1)
  expect(screen.queryByText('اختر مدينة من الأعلى')).toBeNull()
  expect(screen.getByText('اختر مدينة لعرض بلداتها وإدارتها.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'رام الله' }))
  expect(screen.getAllByRole('heading', { name: 'البلدات (رام الله)' })).toHaveLength(1)
  expect(nablus?.hasAttribute('aria-current')).toBe(false)
  expect(screen.getByRole('button', { name: 'رام الله' }).closest('li')?.getAttribute('aria-current')).toBe('true')
})

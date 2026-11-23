// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, renderHook, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ToastContext } from '../../components/ui/ToastContext'
import { request } from '../../api/client'
import { LocationFormModal } from './LocationFormModal'
import { useLocationMutation } from './locationMutations'

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

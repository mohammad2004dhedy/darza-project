// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { DeleteAccount } from './DeleteAccount'
import * as api from '../../../api/client'

const mocks = vi.hoisted(() => ({
  role: 'PUBLISHER',
  logout: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn(),
}))
vi.mock('../../../context/auth', () => ({
  useAuth: () => ({ role: mocks.role, logout: mocks.logout }),
}))
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../../../components/ui/useToast', () => ({ useToast: () => ({ showToast: mocks.toast }) }))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.role = 'PUBLISHER'
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function setup() {
  const client = new QueryClient()
  client.setQueryData(['private'], 'private')
  render(
    <QueryClientProvider client={client}>
      <DeleteAccount />
    </QueryClientProvider>,
  )
  return client
}
it('hides deletion from admins', () => {
  mocks.role = 'ADMIN'
  setup()
  expect(screen.queryByRole('button')).toBeNull()
})
it('requires confirmation and clears the session and all caches after success', async () => {
  const request = vi.spyOn(api, 'request').mockResolvedValue(undefined)
  const client = setup()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الحساب' }))
  expect(request).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الحساب نهائياً' }))
  await waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce())
  expect(request).toHaveBeenCalledWith('/api/users/me', { method: 'DELETE' })
  expect(client.getQueryCache().getAll()).toHaveLength(0)
  expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true })
  expect(mocks.toast).toHaveBeenCalledOnce()
})
it('preserves the session and cache on failure and allows cancellation', async () => {
  vi.spyOn(api, 'request').mockRejectedValue(new Error('offline'))
  const client = setup()
  fireEvent.click(screen.getByRole('button', { name: 'حذف الحساب' }))
  fireEvent.click(screen.getByRole('button', { name: 'حذف الحساب نهائياً' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(mocks.logout).not.toHaveBeenCalled()
  expect(client.getQueryData(['private'])).toBe('private')
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
  expect(document.querySelector('dialog[open]')).toBeNull()
})

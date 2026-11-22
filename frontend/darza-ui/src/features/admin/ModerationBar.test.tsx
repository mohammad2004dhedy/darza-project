// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { ToastContext } from '../../components/ui/ToastContext'
import * as api from './api'
import { ModerationBar } from './ModerationBar'

vi.mock('./api', () => ({ approveProperty: vi.fn(), rejectProperty: vi.fn() }))
const clients: QueryClient[] = []
const adminKey = ['admin', 'properties', 'PENDING']
const feedKey = ['properties', 'feed']

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  client.setQueryData(['unrelated'], 'preserved')
  const adminRefetch = vi.fn().mockResolvedValue([])
  const feedRefetch = vi.fn().mockResolvedValue([])
  const showToast = vi.fn()
  const onSuccess = vi.fn()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  function Observers() {
    useQuery({ queryKey: adminKey, queryFn: adminRefetch, initialData: [], staleTime: Infinity })
    useQuery({ queryKey: feedKey, queryFn: feedRefetch, initialData: [], staleTime: Infinity })
    return <ModerationBar propertyId={23} onSuccess={onSuccess} />
  }
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={{ showToast }}>
        <Observers />
      </ToastContext.Provider>
    </QueryClientProvider>,
  )
  return { client, showToast, onSuccess, invalidate, adminRefetch, feedRefetch }
}

beforeEach(() => {
  vi.mocked(api.approveProperty).mockReset().mockResolvedValue(undefined)
  vi.mocked(api.rejectProperty).mockReset().mockResolvedValue(undefined)
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.restoreAllMocks()
})

it('requires a non-blank rejection reason with a live 300-character limit', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'رفض' }))
  expect(screen.getByRole('dialog', { name: 'رفض الإعلان' })).toBeTruthy()
  const reason = screen.getByRole('textbox', { name: 'سبب الرفض' }) as HTMLTextAreaElement
  const send = screen.getByRole('button', { name: 'إرسال' }) as HTMLButtonElement
  expect(reason.required).toBe(true)
  expect(reason.maxLength).toBe(300)
  expect(screen.getByText('0/300')).toBeTruthy()
  expect(send.disabled).toBe(true)
  fireEvent.change(reason, { target: { value: '   ' } })
  expect(send.disabled).toBe(true)
  fireEvent.click(send)
  expect(api.rejectProperty).not.toHaveBeenCalled()
  fireEvent.change(reason, { target: { value: 'أ'.repeat(300) } })
  expect(screen.getByText('300/300')).toBeTruthy()
  expect(send.disabled).toBe(false)
})

it('sends the trimmed reason, toasts, and refreshes admin lists and public feeds', async () => {
  const { client, showToast, onSuccess, invalidate, adminRefetch, feedRefetch } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'رفض' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'سبب الرفض' }), {
    target: { value: '  بيانات غير مكتملة  ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'إرسال' }))
  await waitFor(() => expect(api.rejectProperty).toHaveBeenCalledWith(23, 'بيانات غير مكتملة'))
  await waitFor(() => expect(feedRefetch).toHaveBeenCalledTimes(1))
  expect(adminRefetch).toHaveBeenCalledTimes(1)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'properties'] })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['properties'] })
  expect(showToast).toHaveBeenCalledWith('تم رفض الإعلان')
  expect(onSuccess).toHaveBeenCalledTimes(1)
  expect(client.getQueryData(['unrelated'])).toBe('preserved')
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('requires confirmation before approval and supports cancellation', async () => {
  const { showToast, onSuccess, adminRefetch, feedRefetch } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'موافقة' }))
  expect(screen.getByRole('dialog', { name: 'الموافقة على الإعلان' })).toBeTruthy()
  expect(api.approveProperty).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(api.approveProperty).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'موافقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'تأكيد الموافقة' }))
  await waitFor(() => expect(api.approveProperty).toHaveBeenCalledWith(23))
  await waitFor(() => expect(feedRefetch).toHaveBeenCalledTimes(1))
  expect(adminRefetch).toHaveBeenCalledTimes(1)
  expect(showToast).toHaveBeenCalledWith('تمت الموافقة على الإعلان')
  expect(onSuccess).toHaveBeenCalledTimes(1)
})

it.each(['approve', 'reject'] as const)(
  'locks all actions while %s is in flight',
  async (action) => {
    let finish!: () => void
    const request = new Promise<void>((resolve) => {
      finish = resolve
    })
    vi.mocked(action === 'approve' ? api.approveProperty : api.rejectProperty).mockReturnValue(
      request,
    )
    setup()
    fireEvent.click(screen.getByRole('button', { name: action === 'approve' ? 'موافقة' : 'رفض' }))
    if (action === 'reject') {
      fireEvent.change(screen.getByRole('textbox', { name: 'سبب الرفض' }), {
        target: { value: 'سبب' },
      })
    }
    const confirm = screen.getByRole('button', {
      name: action === 'approve' ? 'تأكيد الموافقة' : 'إرسال',
    })
    fireEvent.click(confirm)
    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
    fireEvent.click(confirm)
    expect(action === 'approve' ? api.approveProperty : api.rejectProperty).toHaveBeenCalledTimes(1)
    await act(async () => {
      finish()
      await request
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  },
)

it.each([400, 409])('toasts and refetches on an already-moderated %s response', async (status) => {
  vi.mocked(api.approveProperty).mockRejectedValue(new ApiError(status, 'Already moderated'))
  const { showToast, onSuccess, adminRefetch, feedRefetch, invalidate } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'موافقة' }))
  fireEvent.click(screen.getByRole('button', { name: 'تأكيد الموافقة' }))
  await waitFor(() => expect(adminRefetch).toHaveBeenCalledTimes(1))
  expect(feedRefetch).toHaveBeenCalledTimes(1)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'properties'] })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['properties'] })
  expect(showToast).toHaveBeenCalledWith('تمت مراجعة الإعلان بالفعل، جارٍ تحديث القائمة')
  expect(onSuccess).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).toBeNull()
})

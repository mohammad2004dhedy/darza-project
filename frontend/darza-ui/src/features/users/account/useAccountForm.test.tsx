// @vitest-environment jsdom
import {
  act,
  cleanup,
  renderHook,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/client'
import { deleteProfileImage, saveAccount } from './api'
import { useAccountForm } from './useAccountForm'
import { AccountForm } from './AccountForm'
vi.mock('../../location/components/LocationFields', () => ({ LocationFields: () => null }))
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  invalidateQueries: vi.fn(),
  showToast: vi.fn(),
}))
vi.mock('../../../context/auth', () => ({
  useAuth: () => ({
    token: 'token',
    userId: 7,
    role: 'PUBLISHER',
    expiresAt: '2030-01-01',
    login: mocks.login,
  }),
}))
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))
vi.mock('../../../components/ui/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}))
vi.mock('./api', () => ({ saveAccount: vi.fn(), deleteProfileImage: vi.fn() }))
const profile = {
  id: 7,
  displayName: 'قديم',
  email: 'test@example.com',
  phoneNumber: '+970590000000',
  createdAt: '',
  town: { cityId: 1, cityName: 'مدينة', townId: 2, townName: 'بلدة' },
}
beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)
it('preserves session fields, updates the name, invalidates profiles and goes back', async () => {
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => result.current.form.setValue('displayName', 'جديد'))
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(saveAccount).toHaveBeenCalledWith(
    expect.objectContaining({ displayName: 'جديد', townId: 2, countryCode: '970' }),
    { kind: 'unchanged' },
  )
  expect(mocks.login).toHaveBeenCalledWith({
    token: 'token',
    userId: 7,
    role: 'PUBLISHER',
    expiresAt: '2030-01-01',
    displayName: 'جديد',
  })
  expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
  expect(mocks.navigate).toHaveBeenCalledWith(-1)
})
it('maps backend field errors and stays on the form', async () => {
  vi.mocked(saveAccount).mockRejectedValueOnce(
    new ApiError(400, 'invalid', { displayName: 'الاسم غير صالح' }),
  )
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => result.current.form.setValue('displayName', 'جديد'))
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.form.getFieldState('displayName').error?.message).toBe('الاسم غير صالح')
  expect(mocks.login).not.toHaveBeenCalled()
  expect(mocks.navigate).not.toHaveBeenCalled()
})
it('keeps image removal local until save and cancels without saving', () => {
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => result.current.setAvatar({ kind: 'removed' }))
  act(() => result.current.cancel())
  expect(result.current.leave.confirming).toBe(true)
  expect(mocks.navigate).not.toHaveBeenCalled()
  act(() => result.current.leave.confirm())
  expect(saveAccount).not.toHaveBeenCalled()
  expect(mocks.navigate).toHaveBeenCalledWith(-1)
})
it('blocks duplicate saves and updates the session only after save completes', async () => {
  let finish!: () => void
  vi.mocked(saveAccount).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => result.current.form.setValue('displayName', 'جديد'))
  let pending!: Promise<void>
  await act(async () => {
    pending = result.current.onSubmit()
    await result.current.onSubmit()
  })
  expect(saveAccount).toHaveBeenCalledTimes(1)
  expect(mocks.login).not.toHaveBeenCalled()
  await act(async () => {
    finish()
    await pending
  })
  expect(mocks.login).toHaveBeenCalledOnce()
})

it('renders backend errors on the form and cancels local avatar removal', async () => {
  vi.mocked(saveAccount).mockRejectedValueOnce(
    new ApiError(400, 'invalid', { displayName: 'الاسم غير صالح' }),
  )
  render(
    <AccountForm profile={{ ...profile, profileImageUrl: 'https://example.com/avatar.webp' }} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'إزالة الصورة' }))
  expect(saveAccount).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
  await screen.findByText('الاسم غير صالح')
  expect(saveAccount).toHaveBeenCalledWith(expect.anything(), { kind: 'unchanged' })
  expect(deleteProfileImage).not.toHaveBeenCalled()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'إلغاء' }).hasAttribute('disabled')).toBe(false),
  )
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
  fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }))
  expect(mocks.navigate).toHaveBeenCalledWith(-1)
  expect(saveAccount).toHaveBeenCalledTimes(1)
})

it('keeps saved profile changes and retries only avatar deletion after partial failure', async () => {
  let finishDelete!: () => void
  vi.mocked(deleteProfileImage)
    .mockImplementationOnce(() => new Promise<void>((_, reject) => {
      finishDelete = () => reject(new Error('delete failed'))
    }))
    .mockResolvedValueOnce(undefined)
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => {
    result.current.form.setValue('displayName', 'جديد')
    result.current.setAvatar({ kind: 'removed' })
  })
  let submission!: Promise<void>
  await act(async () => { submission = result.current.onSubmit() })
  expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'جديد' }))
  expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
  await act(async () => {
    finishDelete()
    await submission
  })
  expect(mocks.showToast).toHaveBeenLastCalledWith('تم حفظ بياناتك، لكن تعذر حذف الصورة', {
    label: 'إعادة المحاولة',
    onClick: expect.any(Function),
  })
  expect(mocks.navigate).not.toHaveBeenCalled()
  const retry = mocks.showToast.mock.lastCall![1].onClick
  await act(async () => { retry() })
  expect(saveAccount).toHaveBeenCalledTimes(1)
  expect(deleteProfileImage).toHaveBeenCalledTimes(2)
  expect(mocks.navigate).toHaveBeenCalledWith(-1)
})

it('does not save or toast when account fields and avatar are unchanged', async () => {
  const { result } = renderHook(() => useAccountForm(profile))
  expect(result.current.unsaved).toBe(false)
  expect(result.current.form.getValues()).toMatchObject({ cityId: '1', townId: '2' })
  await act(async () => { await result.current.onSubmit() })
  expect(saveAccount).not.toHaveBeenCalled()
  expect(deleteProfileImage).not.toHaveBeenCalled()
  expect(mocks.showToast).not.toHaveBeenCalled()
  expect(mocks.navigate).not.toHaveBeenCalled()
})
it('tracks reverted fields and new or removed avatars and resets the saved baseline', async () => {
  vi.mocked(saveAccount).mockResolvedValueOnce(undefined)
  const { result } = renderHook(() => useAccountForm(profile))
  act(() => result.current.form.setValue('displayName', 'جديد'))
  expect(result.current.unsaved).toBe(true)
  act(() => result.current.form.setValue('displayName', profile.displayName))
  expect(result.current.unsaved).toBe(false)
  act(() => result.current.setAvatar({ kind: 'removed' }))
  expect(result.current.unsaved).toBe(true)
  act(() => result.current.setAvatar({ kind: 'unchanged' }))
  expect(result.current.unsaved).toBe(false)
  act(() => result.current.setAvatar({ kind: 'uploaded', path: 'profile/new.webp', url: 'blob:preview' }))
  expect(result.current.unsaved).toBe(true)
  act(() => result.current.setAvatar({ kind: 'unchanged' }))
  act(() => result.current.form.setValue('displayName', 'جديد'))
  await act(async () => { await result.current.onSubmit() })
  expect(result.current.unsaved).toBe(false)
  mocks.showToast.mockClear()
  await act(async () => { await result.current.onSubmit() })
  expect(saveAccount).toHaveBeenCalledTimes(1)
  expect(mocks.showToast).not.toHaveBeenCalled()
  act(() => result.current.form.setValue('displayName', profile.displayName))
  expect(result.current.unsaved).toBe(true)
})
it('disables account save and shows the helper until a field changes, including after reversion', () => {
  render(<AccountForm profile={profile} />)
  const save = screen.getByRole('button', { name: 'حفظ' }) as HTMLButtonElement
  expect(save.disabled).toBe(true)
  expect(screen.getByText('لا توجد تغييرات للحفظ')).toBeTruthy()
  const name = screen.getByRole('textbox', { name: /الاسم/ })
  fireEvent.change(name, { target: { value: 'جديد' } })
  expect(save.disabled).toBe(false)
  expect(screen.queryByText('لا توجد تغييرات للحفظ')).toBeNull()
  fireEvent.change(name, { target: { value: profile.displayName } })
  expect(save.disabled).toBe(true)
})

import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthStorage } from './authStorage'
import type { LoginResponse } from '../types/api'

const session: LoginResponse = {
  token: 'new',
  userId: 1,
  displayName: 'اختبار',
  role: 'PUBLISHER',
  expiresAt: '2099-01-01T00:00:00Z',
}
let values: Map<string, string>
let target: EventTarget
beforeEach(() => {
  values = new Map()
  target = new EventTarget()
  vi.stubGlobal('window', target)
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
  AuthStorage.clear()
})
afterEach(() => vi.unstubAllGlobals())
function notify(key: string | null = 'darza.session') {
  target.dispatchEvent(Object.assign(new Event('storage'), { key, storageArea: localStorage }))
}
it('replaces cached session with the latest persisted session without writing it back', () => {
  AuthStorage.saveSession({ ...session, token: 'old' })
  const listener = vi.fn()
  const unsubscribe = AuthStorage.subscribe(listener)
  values.set('darza.session', JSON.stringify(session))
  notify()
  expect(AuthStorage.getSession()).toEqual(session)
  expect(listener).toHaveBeenCalledWith(session)
  values.delete('darza.session')
  notify()
  expect(AuthStorage.getSession()).toBeNull()
  expect(listener).toHaveBeenLastCalledWith(null)
  unsubscribe()
  notify()
  expect(listener).toHaveBeenCalledTimes(2)
})
it('ignores unrelated keys and handles clear and invalid session data', () => {
  AuthStorage.saveSession(session)
  const listener = vi.fn()
  const unsubscribe = AuthStorage.subscribe(listener)
  notify('unrelated')
  expect(listener).not.toHaveBeenCalled()
  values.clear()
  notify(null)
  expect(listener).toHaveBeenLastCalledWith(null)
  values.set('darza.session', '{}')
  notify()
  expect(AuthStorage.getSession()).toBeNull()
  unsubscribe()
})

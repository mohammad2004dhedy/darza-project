// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { DraftStorage } from './DraftStorage'
import { defaultValues } from './schema'

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); vi.useRealTimers() })
it('stores only fields and an image reminder, scoped to the user', () => {
  DraftStorage.save(7, 4, { ...defaultValues, title: 'مسودة', latitude: '31.900000', longitude: '35.200000', imagePaths: ['private-file-path'] }, true)
  expect(DraftStorage.read(8)).toBeNull()
  const saved = DraftStorage.read(7)!
  expect(saved.step).toBe(4)
  expect(saved.values.title).toBe('مسودة')
  expect(saved.values.latitude).toBe('31.900000')
  expect(saved.values.hadImages).toBe(true)
  expect('imagePaths' in saved.values).toBe(false)
  DraftStorage.clear(7)
  expect(DraftStorage.read(7)).toBeNull()
})
it('expires after seven days', () => {
  vi.useFakeTimers()
  DraftStorage.save(7, 1, defaultValues, false)
  vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1)
  expect(DraftStorage.read(7)).toBeNull()
})
it('survives unavailable storage', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
  expect(DraftStorage.read(7)).toBeNull()
  expect(() => DraftStorage.save(7, 0, defaultValues, false)).not.toThrow()
  expect(() => DraftStorage.clear(7)).not.toThrow()
})

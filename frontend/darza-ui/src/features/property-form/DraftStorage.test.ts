// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { DraftStorage } from './DraftStorage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

it('removes legacy drafts for the user signing out', () => {
  localStorage.setItem('darza:draft:property:7', 'legacy draft')
  localStorage.setItem('darza:draft:property:8', 'other user')
  DraftStorage.clear(7)
  expect(localStorage.getItem('darza:draft:property:7')).toBeNull()
  expect(localStorage.getItem('darza:draft:property:8')).toBe('other user')
})

it('tolerates unavailable storage during legacy cleanup', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('unavailable') })
  expect(() => DraftStorage.clear(7)).not.toThrow()
})

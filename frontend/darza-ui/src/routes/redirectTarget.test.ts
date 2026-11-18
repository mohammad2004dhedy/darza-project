import { describe, expect, it } from 'vitest'
import { getRedirectTarget } from './redirectTarget'

describe('getRedirectTarget', () => {
  it('restores path, search and hash', () => {
    const state = { from: { pathname: '/profile', search: '?tab=1', hash: '#top' } }
    expect(getRedirectTarget(state)).toBe('/profile?tab=1#top')
  })

  it.each([
    null,
    {},
    { from: { pathname: 'https://evil.example' } },
    { from: { pathname: '//evil.example' } },
    { from: { pathname: '/login' } },
    { from: { pathname: '/register' } },
  ])('falls back to home for %j', (state) => {
    expect(getRedirectTarget(state)).toBe('/')
  })
})

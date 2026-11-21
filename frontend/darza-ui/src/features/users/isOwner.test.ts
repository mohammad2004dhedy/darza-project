import { describe, expect, it } from 'vitest'
import { isOwner } from './isOwner'

describe('isOwner', () => {
  it.each([
    [7, 7, true],
    [8, 7, false],
    [null, 7, false],
    [undefined, 7, false],
    ['7', 7, true],
    [7, '7', true],
    [0, 0, false],
    ['', 0, false],
    [NaN, 7, false],
    [Infinity, Infinity, false],
  ])('compares %s with %s as valid numeric IDs: %s', (currentUserId, id, expected) => {
    expect(isOwner(currentUserId, id)).toBe(expected)
  })
})

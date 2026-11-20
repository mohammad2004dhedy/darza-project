// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect } from 'vitest'
import { AvailabilityBadge } from './AvailabilityBadge'

afterEach(cleanup)

describe('AvailabilityBadge', () => {
  it('shows available with a check and petrol background', () => {
    render(<AvailabilityBadge isAvailable />)
    expect(screen.getByText('متاح').className).toContain('bg-primary')
    expect(screen.getByText('متاح').querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
  it('shows unavailable with a grey background', () => {
    render(<AvailabilityBadge isAvailable={false} />)
    expect(screen.getByText('غير متاح').className).toContain('bg-border')
  })
})

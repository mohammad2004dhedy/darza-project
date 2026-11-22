// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { WizardStepper } from './WizardStepper'

afterEach(cleanup)

it('fills every edit station and keeps the current station distinct and all stations available', () => {
  const onStep = vi.fn()
  render(<WizardStepper editMode step={3} completed={[]} canVisit={() => false} onStep={onStep} busy={false} />)
  const buttons = screen.getAllByRole('button')
  buttons.forEach((button, index) => {
    expect((button as HTMLButtonElement).disabled).toBe(false)
    expect(button.firstElementChild?.className).toContain('bg-primary')
    expect(button.querySelector('.lucide-check')).not.toBeNull()
    fireEvent.click(button)
    expect(onStep).toHaveBeenLastCalledWith(index)
  })
  expect(buttons[3].getAttribute('aria-current')).toBe('step')
  expect(buttons[3].firstElementChild?.className).toContain('ring-2')
  expect(buttons[3].lastElementChild?.className).toContain('font-bold')
})

it('preserves create progress, current styling and locked stations', () => {
  render(<WizardStepper step={1} completed={[true, true, true]} canVisit={(index) => index < 2} onStep={vi.fn()} busy={false} />)
  const buttons = screen.getAllByRole('button')
  expect(buttons[0].firstElementChild?.className).toContain('bg-primary')
  expect(buttons[1].firstElementChild?.className).toContain('bg-surface')
  expect(buttons[2].firstElementChild?.className).toContain('bg-background')
  expect((buttons[2] as HTMLButtonElement).disabled).toBe(true)
})

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { WizardStepper } from './WizardStepper'

afterEach(cleanup)

it('uses current validity in edit mode while keeping the current station distinct and available stations interactive', () => {
  const onStep = vi.fn()
  render(<WizardStepper editMode step={3} completed={[true, true, true, true, true, true, true]} canVisit={() => true} onStep={onStep} busy={false} />)
  const buttons = screen.getAllByRole('button')
  buttons.forEach((button, index) => {
    expect((button as HTMLButtonElement).disabled).toBe(false)
    if (index !== 3 && index < 6) {
      expect(button.firstElementChild?.className).toContain('bg-primary')
      expect(button.querySelector('.lucide-check')).not.toBeNull()
    }
    fireEvent.click(button)
    expect(onStep).toHaveBeenLastCalledWith(index)
  })
  expect(buttons[3].getAttribute('aria-current')).toBe('step')
  expect(buttons[3].firstElementChild?.className).toContain('ring-2')
  expect(buttons[3].lastElementChild?.className).toContain('font-bold')
})

it('preserves create progress and current styling while allowing navigation to validate attempted jumps', () => {
  render(<WizardStepper step={1} completed={[true, true, true]} canVisit={(index) => index < 2} onStep={vi.fn()} busy={false} />)
  const buttons = screen.getAllByRole('button')
  expect(buttons[0].firstElementChild?.className).toContain('bg-primary')
  expect(buttons[1].firstElementChild?.className).toContain('bg-surface')
  expect(buttons[2].firstElementChild?.className).toContain('bg-primary')
  expect((buttons[2] as HTMLButtonElement).disabled).toBe(false)
})


it.each([false, true])('replaces completion with a warning when a field is cleared and restores it when fixed (edit=%s)', (editMode) => {
  const props = { editMode, warnings: Array<boolean>(7).fill(true), step: 3, canVisit: () => true, onStep: vi.fn(), busy: false }
  const completed = Array<boolean>(7).fill(true)
  const view = render(<WizardStepper {...props} completed={completed} />)
  const station = () => screen.getAllByRole('button')[1]
  expect(station().querySelector('.lucide-check')).not.toBeNull()
  view.rerender(<WizardStepper {...props} completed={completed.map((valid, index) => index === 1 ? false : valid)} />)
  expect(station().querySelector('.lucide-check')).toBeNull()
  expect(station().querySelector('.lucide-triangle-alert, .lucide-circle-alert')).not.toBeNull()
  expect(station().firstElementChild?.className).not.toContain('bg-primary')
  view.rerender(<WizardStepper {...props} completed={completed} />)
  expect(station().querySelector('.lucide-check')).not.toBeNull()
  expect(station().querySelector('.lucide-triangle-alert, .lucide-circle-alert')).toBeNull()
})


it('disables every station while busy', () => {
  render(<WizardStepper step={1} completed={[true]} canVisit={() => true} onStep={vi.fn()} busy />)
  screen.getAllByRole('button').forEach((button) => {
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})

it('does not warn about untouched incomplete steps', () => {
  render(<WizardStepper step={0} completed={Array<boolean>(7).fill(false)} canVisit={() => true} onStep={vi.fn()} busy={false} />)
  expect(screen.queryByLabelText('خطوة غير مكتملة')).toBeNull()
  expect(screen.getAllByRole('button')[0].firstElementChild?.className).toContain('border-primary')
})

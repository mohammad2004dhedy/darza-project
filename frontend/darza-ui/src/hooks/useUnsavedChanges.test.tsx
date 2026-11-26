// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useUnsavedChanges } from './useUnsavedChanges'

const navigate = vi.fn()
vi.mock('react-router', async (original) => ({
  ...(await original<typeof import('react-router')>()),
  useNavigate: () => navigate,
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
function Harness({ active }: { active: boolean }) {
  const leave = useUnsavedChanges(active)
  return (
    <>
      <a href="/other">Other</a>
      <button onClick={() => leave.requestLeave(() => navigate(-1))}>Cancel edit</button>
      {leave.confirming && (
        <>
          <button onClick={leave.confirm}>Leave</button>
          <button onClick={leave.cancel}>Stay</button>
        </>
      )}
    </>
  )
}
it('warns before unload only while dirty and cleans up on unmount', () => {
  const view = render(<Harness active={false} />)
  const unload = () => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  }
  expect(unload()).toBe(false)
  view.rerender(<Harness active />)
  expect(unload()).toBe(true)
  view.rerender(<Harness active={false} />)
  expect(unload()).toBe(false)
  view.rerender(<Harness active />)
  view.unmount()
  expect(unload()).toBe(false)
})
it('confirms or cancels link navigation without losing edits', () => {
  render(<Harness active />)
  fireEvent.click(screen.getByText('Other'))
  expect(navigate).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Stay'))
  expect(screen.queryByText('Leave')).toBeNull()
  fireEvent.click(screen.getByText('Other'))
  fireEvent.click(screen.getByText('Leave'))
  expect(navigate).toHaveBeenCalledWith('/other')
})
it('protects explicit cancel actions and lets clean forms leave directly', () => {
  const view = render(<Harness active />)
  fireEvent.click(screen.getByText('Cancel edit'))
  expect(navigate).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Leave'))
  expect(navigate).toHaveBeenCalledWith(-1)
  navigate.mockClear()
  view.rerender(<Harness active={false} />)
  fireEvent.click(screen.getByText('Cancel edit'))
  expect(navigate).toHaveBeenCalledWith(-1)
  expect(screen.queryByText('Leave')).toBeNull()
})

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { createMemoryRouter, Link, RouterProvider, useNavigate } from 'react-router'
import { NavigationGuardProvider } from './NavigationGuardProvider'
import { useUnsavedChanges } from './useUnsavedChanges'

afterEach(cleanup)
function Form() {
  const guard = useUnsavedChanges(true)
  const navigate = useNavigate()
  return (
    <>
      <Link to="/other">Link</Link>
      <button onClick={() => navigate('/other')}>Programmatic</button>
      <button onClick={() => guard.allowLeave(() => navigate('/other'))}>Saved</button>
      {guard.confirming && (
        <>
          <button onClick={guard.confirm}>Leave</button>
          <button onClick={guard.cancel}>Stay</button>
        </>
      )}
    </>
  )
}
function setup() {
  const router = createMemoryRouter(
    [
      {
        path: '/form',
        element: (
          <NavigationGuardProvider>
            <Form />
          </NavigationGuardProvider>
        ),
      },
      { path: '/other', element: <h1>Destination</h1> },
    ],
    { initialEntries: ['/other', '/form'] },
  )
  render(<RouterProvider router={router} />)
  return router
}
it.each(['Link', 'Programmatic'])(
  'blocks %s navigation, allows staying and then leaving',
  async (name) => {
    const router = setup()
    fireEvent.click(screen.getByText(name))
    expect(await screen.findByText('Stay')).toBeTruthy()
    fireEvent.click(screen.getByText('Stay'))
    expect(router.state.location.pathname).toBe('/form')
    fireEvent.click(screen.getByText(name))
    fireEvent.click(await screen.findByText('Leave'))
    expect(await screen.findByRole('heading', { name: 'Destination' })).toBeTruthy()
  },
)
it('blocks browser history navigation until confirmed', async () => {
  const router = setup()
  await act(() => router.navigate(-1))
  fireEvent.click(await screen.findByText('Stay'))
  expect(router.state.location.pathname).toBe('/form')
  await act(() => router.navigate(-1))
  fireEvent.click(await screen.findByText('Leave'))
  await waitFor(() => expect(router.state.location.pathname).toBe('/other'))
})
it('does not block navigation after a successful save', async () => {
  setup()
  fireEvent.click(screen.getByText('Saved'))
  expect(await screen.findByRole('heading', { name: 'Destination' })).toBeTruthy()
  expect(screen.queryByText('Leave')).toBeNull()
})

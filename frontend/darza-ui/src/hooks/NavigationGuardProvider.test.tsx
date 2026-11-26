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

function setupWizard(path: string) {
  const router = createMemoryRouter(
    [
      {
        path,
        element: <NavigationGuardProvider><Form /></NavigationGuardProvider>,
      },
      { path: '/other', element: <h1>Destination</h1> },
    ],
    { initialEntries: [`${path}?step=7&source=listing`] },
  )
  render(<RouterProvider router={router} />)
  return router
}

it.each(['/properties/new', '/properties/9/edit'])(
  'allows wizard step and review transitions, including history navigation, at %s',
  async (path) => {
    const router = setupWizard(path)
    for (const search of [
      '?step=3&source=listing&from=review',
      '?step=7&source=listing',
      '?step=2&source=listing',
    ]) {
      await act(() => router.navigate(path + search))
      expect(router.state.location.search).toBe(search)
      expect(screen.queryByText('Leave')).toBeNull()
    }
    await act(() => router.navigate(-1))
    expect(router.state.location.search).toBe('?step=7&source=listing')
    expect(screen.queryByText('Leave')).toBeNull()
    await act(() => router.navigate(-1))
    expect(router.state.location.search).toBe('?step=3&source=listing&from=review')
    expect(screen.queryByText('Leave')).toBeNull()
  },
)

it.each(['/properties/new', '/properties/9/edit'])(
  'blocks unrelated query changes and actual wizard exits at %s',
  async (path) => {
    const router = setupWizard(path)
    await act(() => router.navigate(`${path}?step=3&source=other&from=review`))
    expect(await screen.findByText('Stay')).toBeTruthy()
    expect(router.state.location.search).toBe('?step=7&source=listing')
    fireEvent.click(screen.getByText('Stay'))
    await act(() => router.navigate('/other'))
    expect(await screen.findByText('Leave')).toBeTruthy()
    expect(router.state.location.pathname).toBe(path)
    fireEvent.click(screen.getByText('Leave'))
    expect(await screen.findByRole('heading', { name: 'Destination' })).toBeTruthy()
  },
)

it('does not exempt step query changes outside a property wizard', async () => {
  const router = setup()
  await act(() => router.navigate('/form?step=2&from=review'))
  expect(await screen.findByText('Stay')).toBeTruthy()
  expect(router.state.location.pathname).toBe('/form')
  expect(router.state.location.search).toBe('')
})

// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { BackButton } from './BackButton'

it('returns to the previous route with a direction-aware arrow', async () => {
  render(
    <MemoryRouter initialEntries={['/previous', '/details']} initialIndex={1}>
      <Routes>
        <Route path="/previous" element={<p>Previous page</p>} />
        <Route path="/details" element={<BackButton />} />
      </Routes>
    </MemoryRouter>,
  )
  const button = screen.getByRole('button', { name: 'رجوع' })
  expect(button.querySelector('svg')?.classList.contains('rtl:rotate-180')).toBe(true)
  fireEvent.click(button)
  expect(await screen.findByText('Previous page')).toBeTruthy()
})

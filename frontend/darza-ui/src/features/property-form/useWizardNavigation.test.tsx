// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import { defaultValues, type FormValues } from './schema'
import { useWizardNavigation } from './useWizardNavigation'

afterEach(cleanup)

function Harness() {
  const form = useForm<FormValues>({
    defaultValues: { ...defaultValues, propertyType: 'HOUSE', listingType: 'SELL' },
  })
  const navigation = useWizardNavigation(form, false, false)
  const location = useLocation()
  return <output data-testid="step">{navigation.step}:{location.search}:{location.key}</output>
}

it.each(['?step=7&from=review&source=test', '?step=4&from=review&source=test'])(
  'replaces direct and refreshed URLs with the first incomplete step: %s', async (search) => {
    const mount = () => render(
      <MemoryRouter initialEntries={[{ pathname: '/properties/new', search, key: 'entry', state: { wizardReviewAccess: true } }]}>
        <Harness />
      </MemoryRouter>,
    )
    for (let refresh = 0; refresh < 2; refresh++) {
      const view = mount()
      await waitFor(() => {
        const text = screen.getByTestId('step').textContent!
        expect(text.startsWith('1:')).toBe(true)
        expect(text).toContain('step=2')
        expect(text).toContain('source=test')
        expect(text).not.toContain('from=review')
        expect(text).not.toContain(':entry')
      })
      view.unmount()
    }
  },
)

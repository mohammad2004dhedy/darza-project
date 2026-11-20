// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyGallery } from './PropertyGallery'

const images = Array.from({ length: 4 }, (_, index) => ({
  path: `${index}`,
  url: `/photo-${index}.jpg`,
}))
let desktop = false

beforeEach(() => {
  desktop = false
  window.history.replaceState({ idx: 1, key: 'property' }, '', '/properties/1')
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '')
  })
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open')
  })
  Element.prototype.scrollTo = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function openViewer(index = 0) {
  fireEvent.click(screen.getByRole('button', { name: `تكبير الصورة ${index + 1}` }))
  await act(async () => {})
  return screen.getByRole('dialog')
}
async function closeViewer(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole('button', { name: 'إغلاق الصور' }))
  await waitFor(() => expect(window.history.state?.darzaPhotoViewer).toBeUndefined())
}

describe('PropertyGallery', () => {
  it('uses Latin counters, keyboard navigation, and no mobile thumbnail downloads', () => {
    render(<PropertyGallery images={images} title="منزل" />)
    expect(screen.getByText('1/4')).toBeTruthy()
    expect(screen.getAllByRole('img')).toHaveLength(4)
    expect(screen.queryByLabelText('الصور المصغرة')).toBeNull()
    const opener = screen.getByRole('button', { name: 'تكبير الصورة 1' })
    fireEvent.keyDown(opener, { key: 'ArrowRight' })
    expect(screen.getByText('2/4')).toBeTruthy()
    fireEvent.keyDown(opener, { key: 'ArrowLeft' })
    expect(screen.getByText('1/4')).toBeTruthy()
    expect(screen.getAllByRole('img')[0].getAttribute('fetchpriority')).toBe('high')
  })

  it('renders every thumbnail on desktop and hides controls for a single image', () => {
    desktop = true
    const { rerender } = render(<PropertyGallery images={images} title="منزل" />)
    expect(within(screen.getByLabelText('الصور المصغرة')).getAllByRole('button')).toHaveLength(4)
    rerender(<PropertyGallery images={images.slice(0, 1)} title="منزل" />)
    expect(screen.queryByText('1/1')).toBeNull()
    expect(screen.queryByLabelText('الصور المصغرة')).toBeNull()
    expect(screen.queryByRole('button', { name: 'الصورة التالية' })).toBeNull()
  })

  it('opens at the selected index, handles arrows, and closes Escape through history', async () => {
    document.body.style.overflow = 'auto'
    render(<PropertyGallery images={images} title="منزل" />)
    const dialog = await openViewer(1)
    expect(within(dialog).getByText('2/4')).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(within(dialog).getByText('3/4')).toBeTruthy()
    expect(screen.getByText('1/4')).toBeTruthy()
    const cancel = new Event('cancel', { cancelable: true })
    fireEvent(dialog, cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    await waitFor(() => expect(window.history.state?.darzaPhotoViewer).toBeUndefined())
    expect(window.history.state).toEqual({ idx: 1, key: 'property' })
  })

  it('pushes once in StrictMode and removes its entry on button close', async () => {
    const push = vi.spyOn(window.history, 'pushState')
    render(
      <StrictMode>
        <PropertyGallery images={images} title="منزل" />
      </StrictMode>,
    )
    const dialog = await openViewer()
    expect(push).toHaveBeenCalledTimes(1)
    await closeViewer(dialog)
    expect(window.location.pathname).toBe('/properties/1')
  })

  it('closes on browser Back without navigating back again', async () => {
    render(<PropertyGallery images={images} title="منزل" />)
    await openViewer()
    const back = vi.spyOn(window.history, 'back')
    window.history.back()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(back).toHaveBeenCalledTimes(1)
    expect(window.history.state).toEqual({ idx: 1, key: 'property' })
  })

  it('cleans up its history entry on unmount but does not pop a later router entry', async () => {
    const first = render(<PropertyGallery images={images} title="منزل" />)
    await openViewer()
    first.unmount()
    await waitFor(() => expect(window.history.state?.darzaPhotoViewer).toBeUndefined())
    const second = render(<PropertyGallery images={images} title="منزل" />)
    await openViewer()
    window.history.pushState({ idx: 2, key: 'other' }, '', '/other')
    const back = vi.spyOn(window.history, 'back')
    second.unmount()
    expect(back).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/other')
  })
})

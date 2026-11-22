// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { LocationPicker } from './LocationPicker'

vi.mock('../../location/components/MapView', () => ({ MapView: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => <button onClick={() => onChange(31.9123456, 35.2345678)}>اختر نقطة تجريبية</button> }))
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(cleanup)
it('opens the picker without geolocation and only commits after confirmation', async () => {
  const onChange = vi.fn(), onLocate = vi.fn()
  render(<LocationPicker state={{ status: 'idle' }} onChange={onChange} onLocate={onLocate} onClear={vi.fn()} />)
  expect(onLocate).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'اختيار الموقع من الخريطة' }))
  expect((screen.getByRole('button', { name: 'تأكيد الموقع' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(await screen.findByRole('button', { name: 'اختر نقطة تجريبية' }))
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'تأكيد الموقع' }))
  expect(onChange).toHaveBeenCalledWith(31.9123456, 35.2345678)
})
it('shows accuracy warning and permits correction and removal', async () => {
  const onChange = vi.fn(), onClear = vi.fn(), onLocate = vi.fn()
  render(<LocationPicker lat={31.9} lng={35.2} state={{ status: 'success', accuracy: 1700 }} onChange={onChange} onLocate={onLocate} onClear={onClear} />)
  expect(screen.getByRole('status').textContent).toContain('1700')
  fireEvent.click(await screen.findByRole('button', { name: 'اختر نقطة تجريبية' }))
  expect(onChange).toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'إزالة الموقع' }))
  expect(onClear).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'استخدام موقعي الحالي' }))
  expect(onLocate).toHaveBeenCalledOnce()
})

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

export function OverlayRouteCleanup() {
  const { key } = useLocation()
  const previous = useRef(key)
  useEffect(() => {
    if (previous.current === key) return
    previous.current = key
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((dialog) => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
      dialog.close()
    })
  }, [key])
  return null
}

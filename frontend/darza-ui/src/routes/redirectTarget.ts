const AUTH_PATHS = ['/login', '/register']

/** Returns the in-app path saved by a route guard in location.state.from, or "/". */
export function getRedirectTarget(state: unknown): string {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)
    ?.from
  const pathname = from?.pathname
  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    AUTH_PATHS.includes(pathname)
  ) {
    return '/'
  }
  const search = typeof from?.search === 'string' ? from.search : ''
  const hash = typeof from?.hash === 'string' ? from.hash : ''
  return `${pathname}${search}${hash}`
}

import { AuthStorage } from '../lib/authStorage'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>
  readonly path?: string

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
    path?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.path = path
  }
}

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  onUnauthorized = handler
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export function buildQueryParams(params: QueryParams): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

async function handleResponse<T>(
  response: Response,
  path: string,
  sentToken: string | undefined,
): Promise<T> {
  if (
    response.status === 401 &&
    sentToken &&
    AuthStorage.getSession()?.token === sentToken &&
    !path.startsWith('/api/auth/')
  )
    onUnauthorized?.()
  const text = await response.text()
  let body: unknown
  try {
    body = text.trim() ? JSON.parse(text) : undefined
  } catch {
    if (response.ok)
      throw new ApiError(response.status, 'استجابة غير صالحة من الخادم', undefined, path)
  }

  if (!response.ok) {
    const error = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const fields = error.fieldErrors
    const fieldErrors =
      fields &&
      typeof fields === 'object' &&
      !Array.isArray(fields) &&
      Object.values(fields).every((value) => typeof value === 'string')
        ? (fields as Record<string, string>)
        : undefined
    throw new ApiError(
      response.status,
      typeof error.message === 'string' && error.message
        ? error.message
        : 'تعذر إتمام الطلب، يرجى المحاولة مجدداً',
      fieldErrors,
      typeof error.path === 'string' ? error.path : path,
    )
  }
  return body as T
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = AuthStorage.getSession()?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  let response: Response
  try {
    response = await fetch(
      `${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}${path}`,
      {
        ...options,
        headers,
      },
    )
  } catch {
    throw new ApiError(0, 'تعذر الاتصال بالخادم')
  }
  return handleResponse<T>(response, path, token)
}

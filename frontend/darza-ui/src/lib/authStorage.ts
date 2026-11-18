import type { LoginResponse } from '../types/api'

const SESSION_KEY = 'darza.session'

function isSession(value: unknown): value is LoginResponse {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>
  return (
    typeof session.token === 'string' &&
    session.token.trim().length > 0 &&
    typeof session.displayName === 'string' &&
    (session.role === 'ADMIN' || session.role === 'PUBLISHER') &&
    typeof session.expiresAt === 'string' &&
    Number.isFinite(Date.parse(session.expiresAt)) &&
    typeof session.userId === 'number' &&
    Number.isSafeInteger(session.userId) &&
    session.userId > 0
  )
}

export class AuthStorage {
  private static memorySession: LoginResponse | null | undefined

  static saveSession(login: LoginResponse): void {
    this.memorySession = { ...login }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(login))
    } catch {
      // Session remains usable in memory when storage is unavailable.
    }
  }

  static getSession(): LoginResponse | null {
    if (this.memorySession !== undefined) {
      return this.memorySession ? { ...this.memorySession } : null
    }
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const session: unknown = JSON.parse(raw)
      return isSession(session) ? session : null
    } catch {
      return null
    }
  }

  static subscribe(listener: (session: LoginResponse | null) => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== SESSION_KEY && event.key !== null))
        return
      // Read current storage, not a potentially stale queued event value.
      this.memorySession = undefined
      listener(this.getSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  static clear(): void {
    // Keep a logout tombstone even if persisted storage cannot be cleared.
    this.memorySession = null
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // Restricted storage must not prevent logout.
    }
  }
}

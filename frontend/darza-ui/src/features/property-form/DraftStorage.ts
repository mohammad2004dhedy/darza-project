export class DraftStorage {
  static clear(userId: number) {
    try {
      localStorage.removeItem(`darza:draft:property:${userId}`)
    } catch { /* Storage may be unavailable. */ }
  }
}

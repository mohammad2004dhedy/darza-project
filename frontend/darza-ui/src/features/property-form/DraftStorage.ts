import type { FormValues } from './schema'

const fields = ['title', 'description', 'propertyType', 'listingType', 'price', 'currency', 'rentPeriod', 'areaSize', 'rooms', 'bathrooms', 'furnished', 'hasBalcony', 'cityId', 'townId', 'address', 'latitude', 'longitude'] as const

type DraftValues = Omit<FormValues, 'imagePaths'> & { hadImages: boolean }
export type PropertyDraft = { version: 1; savedAt: number; step: number; values: DraftValues }
const maxAge = 7 * 24 * 60 * 60 * 1000

export class DraftStorage {
  static read(userId: number): PropertyDraft | null {
    try {
      const key = `darza:draft:property:${userId}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const draft = JSON.parse(raw) as PropertyDraft
      if (draft.version !== 1 || !Number.isFinite(draft.savedAt) || Date.now() - draft.savedAt > maxAge || draft.savedAt > Date.now() || !Number.isInteger(draft.step) || draft.step < 0 || draft.step > 6 || !draft.values || typeof draft.values.hadImages !== 'boolean' || fields.some((field) => typeof draft.values[field] !== 'string')) {
        localStorage.removeItem(key)
        return null
      }
      const values = Object.fromEntries(fields.map((field) => [field, draft.values[field]])) as Omit<FormValues, 'imagePaths'>
      return { version: 1, savedAt: draft.savedAt, step: draft.step, values: { ...values, hadImages: draft.values.hadImages } }
    } catch { return null }
  }

  static save(userId: number, step: number, values: FormValues, hadImages: boolean) {
    try {
      const savedValues = Object.fromEntries(fields.map((key) => [key, values[key]]))
      localStorage.setItem(`darza:draft:property:${userId}`, JSON.stringify({ version: 1, savedAt: Date.now(), step, values: { ...savedValues, hadImages } }))
    } catch { /* Storage may be unavailable. */ }
  }

  static clear(userId: number) {
    try { localStorage.removeItem(`darza:draft:property:${userId}`) } catch { /* Storage may be unavailable. */ }
  }
}

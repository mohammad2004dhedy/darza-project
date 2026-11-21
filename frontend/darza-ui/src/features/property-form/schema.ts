import { z } from 'zod'
import type { Currency, ListingType, PropertyType, RentPeriod } from '../../types/api'

export function normalizeNumber(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, '.')
    .trim()
}

export const imagePathsSchema = z
  .array(z.string().refine((value) => value.trim().length > 0, 'الصورة غير صالحة'))
  .min(1, 'أضف صورة واحدة على الأقل')
  .max(8, 'يمكن إضافة 8 صور كحد أقصى')
  .refine((paths) => new Set(paths).size === paths.length, 'لا يمكن تكرار الصور')

const propertyType = z.enum(['', 'APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OTHER'])
const listingType = z.enum(['', 'SELL', 'RENT'])
const currency = z.enum(['', 'ILS', 'JOD', 'USD'])
const rentPeriod = z.enum(['', 'HOURLY', 'DAILY', 'MONTHLY', 'YEARLY'])
const optionalBoolean = z.enum(['', 'true', 'false'])

function decimalValid(value: string, integers: number, fractions: number, signed = false): boolean {
  const normalized = normalizeNumber(value)
  if (!(signed ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/).test(normalized)) return false
  const [whole, fraction = ''] = normalized.replace(/^-/, '').split('.')
  return (
    whole.replace(/^0+/, '').length <= integers &&
    fraction.length <= fractions &&
    Number.isFinite(Number(normalized))
  )
}

export const formSchema = z
  .object({
    title: z.string().trim().min(1, 'أدخل عنوان الإعلان').max(150, 'الحد الأقصى 150 حرفاً'),
    description: z.string().trim().max(2000, 'الحد الأقصى 2000 حرف'),
    propertyType: propertyType.refine((value) => value !== '', 'اختر نوع العقار'),
    listingType: listingType.refine((value) => value !== '', 'اختر نوع الإعلان'),
    price: z.string(),
    currency: currency.refine((value) => value !== '', 'اختر العملة'),
    rentPeriod,
    areaSize: z.string(),
    rooms: z.string(),
    bathrooms: z.string(),
    furnished: optionalBoolean,
    hasBalcony: optionalBoolean,
    cityId: z.string(),
    townId: z.string(),
    address: z.string().trim().max(150, 'الحد الأقصى 150 حرفاً'),
    latitude: z.string(),
    longitude: z.string(),
    // Local image ids validate selection; buildPayload separately validates backend paths.
    imagePaths: imagePathsSchema,
  })
  .superRefine((values, context) => {
    const error = (field: keyof typeof values, message: string) =>
      context.addIssue({ code: 'custom', path: [field], message })
    if (!decimalValid(values.price, 10, 2)) {
      error('price', 'أدخل سعراً غير سالب، حتى 10 أرقام صحيحة ومنزلتين عشريتين')
    }
    if (normalizeNumber(values.areaSize) && !decimalValid(values.areaSize, 8, 2)) {
      error('areaSize', 'أدخل مساحة غير سالبة، حتى 8 أرقام صحيحة ومنزلتين عشريتين')
    }
    if (values.propertyType !== 'LAND') {
      for (const field of ['rooms', 'bathrooms'] as const) {
        const value = normalizeNumber(values[field])
        if (value && (!/^\d+$/.test(value) || Number(value) > 2147483647)) {
          error(field, 'أدخل عدداً صحيحاً بين 0 و2147483647')
        }
      }
      if (values.listingType === 'RENT' && !values.rentPeriod) {
        error('rentPeriod', 'اختر فترة الإيجار')
      }
    }
    const town = normalizeNumber(values.townId)
    if (!/^\d+$/.test(town) || !Number.isSafeInteger(Number(town)) || Number(town) <= 0) {
      error('townId', 'اختر بلدة صالحة')
    }
    for (const [field, limit] of [
      ['latitude', 90],
      ['longitude', 180],
    ] as const) {
      const value = normalizeNumber(values[field])
      if (value && (!decimalValid(value, 3, 6, true) || Math.abs(Number(value)) > limit)) {
        error(field, `أدخل إحداثياً بين -${limit} و${limit} حتى 6 منازل عشرية`)
      }
    }
    if (Boolean(normalizeNumber(values.latitude)) !== Boolean(normalizeNumber(values.longitude))) {
      error(
        normalizeNumber(values.latitude) ? 'longitude' : 'latitude',
        'أدخل الإحداثيين معاً أو امسحهما',
      )
    }
  })

export type FormValues = z.infer<typeof formSchema>

export const defaultValues: FormValues = {
  title: '',
  description: '',
  propertyType: '',
  listingType: '',
  price: '',
  currency: '',
  rentPeriod: '',
  areaSize: '',
  rooms: '',
  bathrooms: '',
  furnished: '',
  hasBalcony: '',
  cityId: '',
  townId: '',
  address: '',
  latitude: '',
  longitude: '',
  imagePaths: [],
}

export interface CreatePropertyRequest {
  title: string
  description?: string
  propertyType: PropertyType
  listingType: ListingType
  price: number
  currency: Currency
  rentPeriod?: RentPeriod
  areaSize?: number
  rooms?: number
  bathrooms?: number
  furnished?: boolean
  hasBalcony?: boolean
  townId: number
  address?: string
  latitude?: number
  longitude?: number
  imagePaths: string[]
}

export function buildPayload(values: FormValues, imagePaths: string[]): CreatePropertyRequest {
  const paths = imagePathsSchema.parse(imagePaths)
  const parsed = formSchema.parse({ ...values, imagePaths: paths })
  const payload: CreatePropertyRequest = {
    title: parsed.title,
    propertyType: parsed.propertyType as PropertyType,
    listingType: parsed.propertyType === 'LAND' ? 'SELL' : (parsed.listingType as ListingType),
    price: Number(normalizeNumber(parsed.price)),
    currency: parsed.currency as Currency,
    townId: Number(normalizeNumber(parsed.townId)),
    imagePaths: [...paths],
  }
  if (parsed.description) payload.description = parsed.description
  if (parsed.address) payload.address = parsed.address
  if (normalizeNumber(parsed.areaSize)) payload.areaSize = Number(normalizeNumber(parsed.areaSize))
  if (parsed.propertyType !== 'LAND') {
    if (parsed.listingType === 'RENT') payload.rentPeriod = parsed.rentPeriod as RentPeriod
    for (const field of ['rooms', 'bathrooms'] as const) {
      if (normalizeNumber(parsed[field])) payload[field] = Number(normalizeNumber(parsed[field]))
    }
    for (const field of ['furnished', 'hasBalcony'] as const) {
      if (parsed[field] !== '') payload[field] = parsed[field] === 'true'
    }
  }
  for (const field of ['latitude', 'longitude'] as const) {
    const value = normalizeNumber(parsed[field])
    if (value) payload[field] = Number(Number(value).toFixed(6))
  }
  return payload
}

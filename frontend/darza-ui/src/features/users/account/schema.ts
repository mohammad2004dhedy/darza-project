import { z } from 'zod'
import { registerSchema } from '../../auth/schemas'
import { phoneFieldsSchema } from '../../../lib/phone'

const locationId = z
  .string()
  .regex(/^[1-9]\d*$/, 'اختار الموقع')
  .refine((value) => Number.isSafeInteger(Number(value)), 'الموقع غير صالح')
export const accountSchema = z
  .object({
    displayName: registerSchema.shape.displayName,
    countryCode: registerSchema.shape.countryCode,
    phoneNumber: registerSchema.shape.phoneNumber,
    address: registerSchema.shape.address,
  })
  .extend({ cityId: locationId, townId: locationId })
  .superRefine((values, context) => {
    const result = phoneFieldsSchema.safeParse(values)
    for (const issue of result.error?.issues ?? []) {
      context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  })
export type AccountValues = z.input<typeof accountSchema>
export type AccountSubmission = z.output<typeof accountSchema>

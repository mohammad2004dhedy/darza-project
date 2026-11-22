import { z } from 'zod'
import { countryCodeSchema, isValidPhone, phoneFieldsSchema } from '../../lib/phone'

const email = z
  .string()
  .trim()
  .min(1, 'يجب إدخال الإيميل')
  .max(255, 'الإيميل لازم ما يزيد عن 255 حرف')
  .pipe(z.email('الإيميل غير صالح'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'يجب إدخال كلمة المرور'),
})

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'يجب إدخال الاسم')
      .max(100, 'الاسم لازم ما يزيد عن 100 حرف'),
    email,
    password: z
      .string()
      .min(8, 'كلمة المرور لازم تكون 8 أحرف على الأقل')
      .max(64, 'كلمة المرور لازم ما تزيد عن 64 حرف'),
    countryCode: countryCodeSchema,
    phoneNumber: z
      .string()
      .min(1, 'يجب إدخال رقم الهاتف')
      .refine(
        (value) => isValidPhone('972', value),
        'رقم الهاتف لازم يكون 9 أرقام ويبلش بمقدمة فلسطينية أو إسرائيلية',
      ),
    cityId: z.string().min(1, 'اختار المدينة'),
    townId: z.string().min(1, 'اختار البلدة'),
    address: z.string().trim().max(255, 'العنوان لازم ما يزيد عن 255 حرف'),
  })
  .superRefine(({ countryCode, phoneNumber }, context) => {
    const result = phoneFieldsSchema.safeParse({ countryCode, phoneNumber })
    for (const issue of result.error?.issues ?? []) {
      if (issue.path[0] === 'countryCode') {
        context.addIssue({ code: 'custom', path: ['countryCode'], message: issue.message })
      }
    }
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.input<typeof registerSchema>
export type RegisterSubmission = z.output<typeof registerSchema>

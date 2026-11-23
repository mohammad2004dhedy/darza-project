import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(100, 'الاسم يجب ألا يتجاوز 100 حرف'),
})
export type LocationValues = z.infer<typeof locationSchema>

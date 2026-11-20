import { expect, it } from 'vitest'
import { buildInquiryMessage } from './whatsapp'
it('builds the exact multiline Arabic inquiry', () => {
  expect(
    buildInquiryMessage({
      title: 'بيت',
      townName: 'بيرزيت',
      cityName: 'رام الله',
      url: 'https://darza.test/properties/7',
    }),
  ).toBe(
    'مرحبا، أنا مهتم بإعلانك في درزة:\nبيت\nالمنطقة: بيرزيت، رام الله\nالرابط: https://darza.test/properties/7\nهل ما زال متاحًا؟',
  )
})

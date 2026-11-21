import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  defaultValues,
  formSchema,
  imagePathsSchema,
  normalizeNumber,
  type FormValues,
} from './schema'

const valid: FormValues = {
  ...defaultValues,
  title: 'عقار للبيع',
  propertyType: 'APARTMENT',
  listingType: 'SELL',
  price: '100',
  currency: 'ILS',
  cityId: '1',
  townId: '2',
  imagePaths: ['local-image-id'],
}
const paths = ['properties/7/backend-returned.webp']

function expectInvalid(override: Record<string, unknown>, field: string) {
  const result = formSchema.safeParse({ ...valid, ...override })
  expect(result.success).toBe(false)
  expect(result.error?.issues.some((issue) => issue.path[0] === field)).toBe(true)
}

describe('normalizeNumber', () => {
  it.each([
    [' ٠١٢٣٤٥٦٧٨٩٫٥ ', '0123456789.5'],
    ['۰۱۲۳۴۵۶۷۸۹٫۲', '0123456789.2'],
    ['-٣١٫١٢٣٤٥٦', '-31.123456'],
    ['12.50', '12.50'],
  ])('normalizes %s to Latin digits', (input, output) => {
    expect(normalizeNumber(input)).toBe(output)
  })
})

describe('formSchema', () => {
  it('starts with no currency and no optional boolean choice', () => {
    expect(defaultValues.currency).toBe('')
    expect(defaultValues.furnished).toBe('')
    expect(defaultValues.hasBalcony).toBe('')
  })

  it('accepts optional blanks and keeps numeric values as strings', () => {
    const parsed = formSchema.parse(valid)
    expect(parsed.price).toBe('100')
    expect(parsed.townId).toBe('2')
    expect(parsed.rooms).toBe('')
  })

  it.each([
    ['title', ''],
    ['title', '   '],
    ['title', 'x'.repeat(151)],
    ['description', 'x'.repeat(2001)],
    ['address', 'x'.repeat(151)],
    ['propertyType', ''],
    ['propertyType', 'CASTLE'],
    ['listingType', ''],
    ['listingType', 'BUY'],
    ['currency', ''],
    ['currency', 'EUR'],
    ['rentPeriod', 'WEEKLY'],
    ['furnished', false],
    ['hasBalcony', 'yes'],
    ['price', ''],
    ['price', '-1'],
    ['price', '10000000000'],
    ['price', '1.001'],
    ['price', '1e2'],
    ['price', 'Infinity'],
    ['price', 'NaN'],
    ['price', '1,000'],
    ['price', '.5'],
    ['price', '1.'],
    ['areaSize', '-1'],
    ['areaSize', '100000000'],
    ['areaSize', '1.001'],
    ['rooms', '-1'],
    ['rooms', '1.5'],
    ['rooms', '2147483648'],
    ['bathrooms', '2147483648'],
    ['bathrooms', '1e2'],
    ['townId', ''],
    ['townId', '0'],
    ['townId', '-1'],
    ['townId', '1.5'],
    ['townId', '9007199254740992'],
    ['latitude', '90.000001'],
    ['latitude', '-90.000001'],
    ['latitude', '1.1234567'],
    ['longitude', '180.000001'],
    ['longitude', '-180.000001'],
    ['longitude', '1.1234567'],
  ])('rejects invalid %s: %s', (field, value) => {
    expectInvalid({ [field]: value }, field)
  })

  it('accepts exact numeric and text boundaries', () => {
    expect(
      formSchema.safeParse({
        ...valid,
        title: 'x'.repeat(150),
        description: 'x'.repeat(2000),
        address: 'x'.repeat(150),
        price: '9999999999.99',
        areaSize: '99999999.99',
        rooms: '2147483647',
        bathrooms: '0',
        latitude: '-90.000000',
        longitude: '180.000000',
      }).success,
    ).toBe(true)
  })

  it('accepts Arabic and Persian numerals without converting form values to numbers', () => {
    const parsed = formSchema.parse({ ...valid, price: '۱۲٫٥٠', townId: '٢', rooms: '٠' })
    expect(parsed.price).toBe('۱۲٫٥٠')
    expect(buildPayload(parsed, paths)).toMatchObject({ price: 12.5, townId: 2, rooms: 0 })
  })

  it.each([
    ['latitude', 'longitude'],
    ['longitude', 'latitude'],
  ])('requires the other coordinate when %s is present', (present, missing) => {
    expectInvalid({ [present]: '0' }, missing)
  })

  it.each(['HOURLY', 'DAILY', 'MONTHLY', 'YEARLY'] as const)('accepts RENT with %s', (period) => {
    const values = { ...valid, listingType: 'RENT' as const, rentPeriod: period }
    expect(formSchema.safeParse(values).success).toBe(true)
    expect(buildPayload(values, paths).rentPeriod).toBe(period)
  })

  it('requires rentPeriod only when applicable', () => {
    expectInvalid({ listingType: 'RENT' }, 'rentPeriod')
    expect(formSchema.safeParse({ ...valid, listingType: 'SELL' }).success).toBe(true)
    expect(
      formSchema.safeParse({ ...valid, propertyType: 'LAND', listingType: 'RENT' }).success,
    ).toBe(true)
  })

  it('omits stale rentPeriod after RENT -> SELL', () => {
    const rented: FormValues = { ...valid, listingType: 'RENT', rentPeriod: 'MONTHLY' }
    expect(buildPayload(rented, paths).rentPeriod).toBe('MONTHLY')
    expect(buildPayload({ ...rented, listingType: 'SELL' }, paths)).not.toHaveProperty('rentPeriod')
  })

  it('forces LAND to SELL and strips hidden fields, even with invalid stale numeric values', () => {
    const land: FormValues = {
      ...valid,
      propertyType: 'LAND',
      listingType: 'RENT',
      rentPeriod: 'MONTHLY',
      rooms: 'invalid old value',
      bathrooms: '-3',
      furnished: 'true',
      hasBalcony: 'false',
    }
    const payload = buildPayload(land, paths)
    expect(payload.listingType).toBe('SELL')
    for (const field of ['rentPeriod', 'rooms', 'bathrooms', 'furnished', 'hasBalcony']) {
      expect(payload).not.toHaveProperty(field)
    }
    expectInvalid({ ...land, propertyType: 'HOUSE', rentPeriod: '', rooms: '' }, 'rentPeriod')
    expect(
      buildPayload(
        { ...valid, propertyType: 'HOUSE', listingType: 'RENT', rentPeriod: 'DAILY' },
        paths,
      ).listingType,
    ).toBe('RENT')
  })
})

describe('imagePathsSchema', () => {
  it.each([[], [''], ['   '], ['same', 'same'], Array.from({ length: 9 }, (_, i) => `path-${i}`)])(
    'rejects invalid paths %j',
    (...items) => {
      // each passes array entries as arguments; retain their original array shape.
      expect(imagePathsSchema.safeParse(items).success).toBe(false)
    },
  )

  it('accepts 1 through 8 unique paths in supplied order', () => {
    for (let count = 1; count <= 8; count++) {
      const selected = Array.from({ length: count }, (_, i) => `backend-${count - i}`)
      expect(imagePathsSchema.parse(selected)).toEqual(selected)
    }
  })
})

describe('buildPayload', () => {
  it('uses only the separately supplied paths and preserves their exact order', () => {
    const backendPaths = ['backend-third', 'backend-first', 'backend-second']
    const payload = buildPayload(valid, backendPaths)
    expect(payload.imagePaths).toEqual(backendPaths)
    expect(payload.imagePaths).not.toBe(backendPaths)
    expect(payload).not.toHaveProperty('cityId')
  })

  it('validates supplied backend paths independently from local selections', () => {
    expect(() => buildPayload(valid, [])).toThrow()
    expect(() => buildPayload(valid, ['duplicate', 'duplicate'])).toThrow()
    expect(() => buildPayload(valid, [' '])).toThrow()
  })

  it('refuses unsafe values instead of silently coercing them', () => {
    expect(() => buildPayload({ ...valid, price: '1e100' }, paths)).toThrow()
    expect(() => buildPayload({ ...valid, townId: 'not-a-town' }, paths)).toThrow()
  })

  it('omits all blank optional values and never creates null or undefined entries', () => {
    const payload = buildPayload(
      { ...valid, description: '  ', address: '  ', areaSize: '  ' },
      paths,
    )
    expect(payload).toEqual({
      title: valid.title,
      propertyType: 'APARTMENT',
      listingType: 'SELL',
      price: 100,
      currency: 'ILS',
      townId: 2,
      imagePaths: paths,
    })
    expect(Object.values(payload).every((value) => value !== null && value !== undefined)).toBe(
      true,
    )
  })

  it('preserves zero and false and trims optional text', () => {
    expect(
      buildPayload(
        {
          ...valid,
          title: ' عنوان ',
          description: ' وصف ',
          address: ' عنوان الشارع ',
          price: '٠',
          areaSize: '۰٫۰۰',
          rooms: '0',
          bathrooms: '0',
          furnished: 'false',
          hasBalcony: 'true',
          latitude: '0',
          longitude: '-0.000001',
        },
        paths,
      ),
    ).toMatchObject({
      title: 'عنوان',
      description: 'وصف',
      address: 'عنوان الشارع',
      price: 0,
      areaSize: 0,
      rooms: 0,
      bathrooms: 0,
      furnished: false,
      hasBalcony: true,
      latitude: 0,
      longitude: -0.000001,
    })
  })

  it('submits coordinates with at most six decimal places', () => {
    expect(
      buildPayload({ ...valid, latitude: '٣١٫١٢٣٤٥٦', longitude: '35.000000' }, paths),
    ).toMatchObject({
      latitude: 31.123456,
      longitude: 35,
    })
  })
})

// V3__create_tables.sql: price NUMERIC(12,2), area_size NUMERIC(10,2).
export const numericLimits = {
  price: { maxIntegerDigits: 12 - 2, maxDecimals: 2 },
  areaSize: { maxIntegerDigits: 10 - 2, maxDecimals: 2 },
  rooms: { maxIntegerDigits: 4, maxDecimals: 0 },
  bathrooms: { maxIntegerDigits: 4, maxDecimals: 0 },
} as const

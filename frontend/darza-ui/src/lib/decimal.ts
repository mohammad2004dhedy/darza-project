export interface DecimalLimits {
  maxIntegerDigits: number
  maxDecimals: number
}

export function sanitizeDecimal(text: string, { maxIntegerDigits, maxDecimals }: DecimalLimits) {
  const normalized = text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/[,٫]/g, '.')
    .replace(/[^\d.]/g, '')
  const separator = normalized.indexOf('.')
  const whole = (separator < 0 ? normalized : normalized.slice(0, separator))
    .replace(/^0+(?=\d)/, '')
    .slice(0, maxIntegerDigits)
  if (separator < 0 || maxDecimals === 0) return whole
  const fraction = normalized.slice(separator + 1).replace(/\./g, '').slice(0, maxDecimals)
  return `${whole || '0'}.${fraction}`
}

const locale = 'ar-u-nu-latn'
const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
const longFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
const fullFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'long' })

export function formatPublishedAt(iso?: string, now = Date.now()) {
  if (!iso) return null
  const timestamp = Date.parse(iso)
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return null
  const seconds = Math.max(0, (now - timestamp) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 86400],
    ['month', 30 * 86400],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const unit = units.find(([, duration]) => seconds >= duration)
  return {
    relative: unit ? relativeFormat.format(-Math.floor(seconds / unit[1]), unit[0]).replace(/^قبل /, 'منذ ') : 'الآن',
    date: longFormat.format(timestamp),
    full: fullFormat.format(timestamp),
  }
}

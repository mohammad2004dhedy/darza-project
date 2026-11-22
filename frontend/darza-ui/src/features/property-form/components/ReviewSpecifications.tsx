import { Fragment } from 'react'
import type { FormValues } from '../schema'

export function ReviewSpecifications({ values }: { values: FormValues }) {
  const rows = [
    ['المساحة (م²)', values.areaSize],
    ...(values.propertyType === 'LAND'
      ? []
      : [
          ['الغرف', values.rooms],
          ['الحمامات', values.bathrooms],
          ['مفروش', values.furnished],
          ['شرفة', values.hasBalcony],
        ]),
  ].filter(([, value]) => value !== '' && value !== undefined)
  if (!rows.length) return null
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>
            <bdi>{value === 'true' ? 'نعم' : value === 'false' ? 'لا' : value}</bdi>
          </dd>
        </Fragment>
      ))}
    </dl>
  )
}

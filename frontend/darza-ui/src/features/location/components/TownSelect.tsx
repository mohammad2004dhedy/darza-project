import { forwardRef } from 'react'
import { LocationSelect, type LocationSelectProps } from './LocationSelect'

type TownSelectProps = Omit<LocationSelectProps, 'label' | 'placeholder' | 'loadError'> & {
  hasCity: boolean
  loading: boolean
  failed: boolean
}
export const TownSelect = forwardRef<HTMLSelectElement, TownSelectProps>(function TownSelect(
  { hasCity, loading, failed, items, disabled, ...props },
  ref,
) {
  let placeholder = 'اختار البلدة'
  if (!hasCity) placeholder = 'اختار المدينة أول'
  else if (loading) placeholder = 'جاري تحميل البلدات…'
  else if (items?.length === 0) placeholder = 'ما في بلدات لهاي المدينة'
  return (
    <LocationSelect
      {...props}
      ref={ref}
      items={items}
      label="البلدة"
      placeholder={placeholder}
      loadError={failed ? 'تعذر تحميل البلدات' : undefined}
      disabled={disabled || !hasCity || loading}
    />
  )
})

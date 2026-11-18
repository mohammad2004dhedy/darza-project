import { forwardRef } from 'react'
import { LocationSelect, type LocationSelectProps } from './LocationSelect'

type CitySelectProps = Omit<LocationSelectProps, 'label' | 'placeholder' | 'loadError'> & {
  loading: boolean
  failed: boolean
}
export const CitySelect = forwardRef<HTMLSelectElement, CitySelectProps>(function CitySelect(
  { loading, failed, disabled, ...props },
  ref,
) {
  return (
    <LocationSelect
      {...props}
      ref={ref}
      label="المدينة"
      placeholder={loading ? 'جاري تحميل المدن…' : 'اختار المدينة'}
      loadError={failed ? 'تعذر تحميل المدن' : undefined}
      disabled={disabled || loading}
    />
  )
})

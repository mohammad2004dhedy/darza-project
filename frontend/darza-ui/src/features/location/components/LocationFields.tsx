import type { UseFormRegisterReturn } from 'react-hook-form'
import { useCities, useTowns } from '../hooks'
import { CitySelect } from './CitySelect'
import { TownSelect } from './TownSelect'

interface LocationFieldsProps {
  cityId: string
  city: UseFormRegisterReturn & { value?: string }
  town: UseFormRegisterReturn & { value?: string }
  cityError?: string
  townError?: string
}
export function LocationFields({ cityId, city, town, cityError, townError }: LocationFieldsProps) {
  const cities = useCities()
  const towns = useTowns(cityId ? Number(cityId) : undefined)
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <CitySelect
        {...city}
        required
        items={cities.data}
        loading={cities.isPending}
        failed={cities.isError}
        onRetry={() => void cities.refetch()}
        error={cityError}
      />
      <TownSelect
        {...town}
        required
        items={towns.data}
        hasCity={Boolean(cityId)}
        loading={Boolean(cityId) && towns.isPending}
        failed={towns.isError}
        onRetry={() => void towns.refetch()}
        error={townError}
      />
    </div>
  )
}

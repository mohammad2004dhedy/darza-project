import type { PropertyDetailsResponse } from '../../types/api'
import { defaultValues, type FormValues } from './schema'

export function editValues(property: PropertyDetailsResponse): FormValues {
  const number = (value: number | undefined) => (value == null ? '' : String(value))
  const boolean = (value: boolean | undefined) => (value == null ? '' : String(value))
  return {
    ...defaultValues,
    title: property.title,
    description: property.description ?? '',
    propertyType: property.propertyType,
    listingType: property.propertyType === 'LAND' ? 'SELL' : property.listingType,
    price: String(property.price),
    currency: property.currency,
    rentPeriod: property.rentPeriod ?? '',
    areaSize: number(property.areaSize),
    rooms: number(property.rooms),
    bathrooms: number(property.bathrooms),
    furnished: boolean(property.furnished) as FormValues['furnished'],
    hasBalcony: boolean(property.hasBalcony) as FormValues['hasBalcony'],
    cityId: String(property.town.cityId),
    townId: String(property.town.townId),
    address: property.address ?? '',
    latitude: number(property.latitude),
    longitude: number(property.longitude),
    imagePaths: property.images.map((image) => image.path),
  }
}

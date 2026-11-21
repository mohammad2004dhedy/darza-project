export type UserRole = 'ADMIN' | 'PUBLISHER'
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'LAND' | 'COMMERCIAL' | 'OTHER'
export type ListingType = 'SELL' | 'RENT'
export type Currency = 'ILS' | 'JOD' | 'USD'
export type RentPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY'
export type PostingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LoginResponse {
  token: string
  displayName: string
  role: UserRole
  expiresAt: string
  userId: number
}

export interface CreateUserRequest {
  displayName: string
  email: string
  password: string
  countryCode: '970' | '972'
  /** Nine digits without the leading zero; the backend stores +{countryCode}{phoneNumber}. */
  phoneNumber: string
  townId: number
  address?: string
}

export interface UpdateUserRequest {
  displayName: string
  countryCode: '970' | '972'
  phoneNumber: string
  townId: number
  address?: string
  profileImagePath?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CityResponse {
  id: number
  name: string
}
export interface TownResponse {
  id: number
  name: string
}
export interface DetailedTownResponse {
  townId: number
  townName: string
  cityId: number
  cityName: string
}

export interface SliceResponse<T> {
  content: T[]
  hasNext: boolean
  page: number
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}

export interface MyProfileUserResponse {
  id: number
  displayName: string
  phoneNumber: string
  email: string
  address?: string
  town?: DetailedTownResponse
  profileImageUrl?: string
  createdAt: string
}

export interface PublicUserProfileResponse {
  id: number
  displayName: string
  phoneNumber?: string
  town?: DetailedTownResponse
  profileImageUrl?: string
  createdAt: string
}

export interface PropertyUserResponse {
  id: number
  displayName: string
  profileImageUrl?: string
  phoneNumber?: string
}

export interface ImageResponse {
  path: string
  url: string
}

export interface PropertyCardResponse {
  id: number
  title: string
  propertyType: PropertyType
  listingType: ListingType
  postingStatus?: PostingStatus
  rejectionReason?: string
  rentPeriod?: RentPeriod
  price: number
  currency: Currency
  areaSize?: number
  rooms?: number
  bathrooms?: number
  town: DetailedTownResponse
  isAvailable: boolean
  approvedAt?: string
  user: PropertyUserResponse
  coverImageUrl?: string
}

export interface PropertyDetailsResponse extends Omit<PropertyCardResponse, 'coverImageUrl'> {
  description?: string
  areaSize?: number
  rooms?: number
  bathrooms?: number
  furnished?: boolean
  hasBalcony?: boolean
  address?: string
  latitude?: number
  longitude?: number
  images: ImageResponse[]
}

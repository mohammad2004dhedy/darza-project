# Darza Backend API

This document describes the API implemented by the current controllers. Paths are relative to the server root. Requests with a body use JSON (`Content-Type: application/json`). Protected endpoints require `Authorization: Bearer <token>`. `/api/auth/**` and `/api/public/**` are public; `/api/admin/**` requires the `ADMIN` role. `DELETE /api/users/me` requires the `PUBLISHER` role.

Path IDs must be positive integers. Pagination starts at page `0`. Response types are defined in [Response shapes](#response-shapes).

## `/api/auth`

| Endpoint | Request | Success response |
| --- | --- | --- |
| `POST /api/auth/register` | JSON `CreateUserRequest` | `201 Created` + `MyProfileUserResponse` |
| `POST /api/auth/login` | JSON `LoginRequest` | `200 OK` + `LoginResponse` |

**`CreateUserRequest`**

```json
{
  "displayName": "Example User",
  "email": "user@example.com",
  "password": "password123",
  "phoneNumber": "0591234567",
  "countryCode": "970",
  "townId": 1,
  "address": "Optional address"
}
```

`displayName` is required (up to 100 characters); `email` is required, valid, and at most 255 characters; `password` is required (8–64 characters); `phoneNumber` must contain 9 digits, or 10 digits with one leading `0` (removed before validation); `countryCode` is required and must be `970` or `972`; `townId` is required, positive, and must identify an existing town. `address` is optional (up to 255 characters). After removing the optional leading `0`, numbers with `972` may start with `50`, `52`, `53`, `54`, `55`, `58`, `56`, or `59`. Numbers with `970` must start with `56` or `59`. The stored and returned phone number starts with `+` followed by the country code and the 9-digit number.

**`LoginRequest`**

```json
{ "email": "user@example.com", "password": "password123" }
```

Both fields are required, and `email` must have a valid email format. Use the returned `token` as the Bearer token for protected endpoints.

## `/api/public/location`

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/public/location/city/getAll` | No parameters or body | `200 OK` + `CityResponse[]` |
| `GET /api/public/location/town/getAll` | Required positive query `cityId`; example: `?cityId=1` | `200 OK` + `TownResponse[]` for that city, ordered by name |

## `/api/public/properties`

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/public/properties/{id}` | Positive path `id`; Bearer token optional | `200 OK` + `PropertyDetailsResponse`. Unapproved properties are visible only to their owner or an admin. |
| `GET /api/public/properties/feed` | Optional query `page` (default `0`) | `200 OK` + `SliceResponse<PropertyCardResponse>` of approved, available properties. |
| `GET /api/public/properties/search` | Optional query filters below; no JSON body | `200 OK` + `SliceResponse<PropertyCardResponse>` of approved, available properties. |

Search parameters are passed in the query string, for example `?cityId=1&listingType=RENT&currency=ILS&maxPrice=1000&page=0`:

| Parameter | Accepted values |
| --- | --- |
| `propertyType` | `APARTMENT`, `HOUSE`, `VILLA`, `LAND`, `COMMERCIAL`, `OTHER` |
| `listingType` | `SELL`, `RENT` |
| `minPrice`, `maxPrice` | Nonnegative decimal with up to two fractional digits; specifying either requires `currency` |
| `currency` | `ILS`, `JOD`, `USD` |
| `cityId`, `townId` | Nonnegative integer |
| `text` | Search text of at most 100 characters; searches title, description, and publisher display name |
| `sortType` | `NEWEST` (default), `OLDEST`, `PRICE_ASC`, `PRICE_DESC` |
| `page` | Nonnegative integer (default `0`) |

## `/api/public/users`

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/public/users/{userId}/profile` | Positive path `userId` | `200 OK` + `PublicUserProfileResponse` |
| `GET /api/public/users/{userId}/properties` | Positive path `userId`; optional query `page` (default `0`) | `200 OK` + `SliceResponse<PropertyCardResponse>` of the user's approved properties |

## `/api/users/me`

All endpoints in this section require authentication. The user is identified by the token; no `userId` is sent.

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/users/me` | No parameters or body | `200 OK` + `MyProfileUserResponse` |
| `PUT /api/users/me` | JSON `UpdateUserRequest` | `200 OK` + updated `MyProfileUserResponse` |
| `DELETE /api/users/me` | No body; requires `PUBLISHER` | `200 OK`, empty body; deletes the account and its properties |
| `GET /api/users/me/properties` | Optional query `page` (default `0`) | `200 OK` + `SliceResponse<PropertyCardResponse>`, including the user's posting statuses |
| `DELETE /api/users/me/profile/image` | No body | `204 No Content`, empty body |

**`UpdateUserRequest`**

```json
{
  "displayName": "Updated Name",
  "phoneNumber": "0599999999",
  "countryCode": "970",
  "townId": 1,
  "address": "Optional address",
  "profileImagePath": "profiles/1/550e8400-e29b-41d4-a716-446655440000.webp"
}
```

`displayName`, `phoneNumber`, `countryCode`, and `townId` are required. `phoneNumber` and `countryCode` follow the same rules as `CreateUserRequest`, and the stored phone number is replaced with the normalized `+{countryCode}{9-digit number}`. `townId` must be positive and identify an existing town. `address` and `profileImagePath` are optional. A new image path must match `profiles/{currentUserId}/{lowercase UUID}.webp`. Use the separate delete endpoint to remove the profile image.

## `/api/property`

All endpoints in this section require authentication. Updating, deleting, and changing availability require ownership of the property.

| Endpoint | Request | Success response |
| --- | --- | --- |
| `POST /api/property` | JSON `CreatePropertyRequest` | `201 Created` + `PropertyDetailsResponse`; `Location: /api/public/properties/{id}` |
| `PUT /api/property/{propertyId}` | Positive path `propertyId` + JSON `CreatePropertyRequest` | `200 OK` + `PropertyDetailsResponse` |
| `PATCH /api/property/{propertyId}/availability` | Positive path `propertyId`; no body | `204 No Content`; toggles availability of an approved property |
| `DELETE /api/property/{propertyId}` | Positive path `propertyId`; no body | `204 No Content` |

**`CreatePropertyRequest`** is used for both creation and update:

```json
{
  "title": "Property title",
  "description": "Optional description",
  "propertyType": "APARTMENT",
  "listingType": "RENT",
  "price": 1000.00,
  "currency": "ILS",
  "rentPeriod": "MONTHLY",
  "areaSize": 120.50,
  "rooms": 3,
  "bathrooms": 2,
  "furnished": false,
  "hasBalcony": true,
  "townId": 1,
  "address": "Optional address",
  "latitude": 31.500000,
  "longitude": 34.500000,
  "imagePaths": ["properties/1/550e8400-e29b-41d4-a716-446655440000.webp"]
}
```

Required fields: `title` (up to 150 characters), `propertyType`, `listingType`, nonnegative `price` (up to two decimal places), `currency`, positive `townId`, and `imagePaths` (1–8 nonblank paths). Every image path must match `properties/{currentUserId}/{lowercase UUID}.webp`, including paths retained during an update. A path can belong to only one property image record; reusing a path for another property violates a database uniqueness constraint. `description` is optional (up to 2,000 characters), and `address` is optional (up to 150 characters). `areaSize`, `rooms`, and `bathrooms` cannot be negative. `latitude` must be between -90 and 90; `longitude` between -180 and 180. Send both coordinates or neither.

`rentPeriod` can be `HOURLY`, `DAILY`, `MONTHLY`, or `YEARLY` and is required only for `RENT`; omit it for `SELL`. `furnished` and `hasBalcony` are optional for non-land properties. `LAND` can only be sold and cannot include rooms, bathrooms, furnishing, or balcony fields.

Updating an approved or rejected property resubmits it as `PENDING` and clears its previous moderation details. An admin updating a property approves it in the same request.

## `/api/storage`

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/storage/upload` | Bearer token and required query parameters `count` (integer >= 1) and `type` (`PROPERTY` or `PROFILE`); example: `?count=1&type=PROFILE` | `200 OK` + `ImageUploadUrlsResponse` |

The service derives the user ID from the authenticated account and creates paths under `properties/{userId}/` or `profiles/{userId}/`. Each filename is a lowercase UUID followed by `.webp`. The response contains signed upload URLs and the corresponding paths to use in a property or profile request.

## `/api/admin/location`

All endpoints in this section require the `ADMIN` role.

| Endpoint | Request | Success response |
| --- | --- | --- |
| `POST /api/admin/location/city` | JSON `CreateCityRequest`: `{ "name": "City name" }` | `201 Created` + `CityResponse` |
| `PUT /api/admin/location/city/{cityId}` | Positive path `cityId` + JSON `CreateCityRequest` | `200 OK` + `CityResponse` |
| `DELETE /api/admin/location/city/{cityId}` | Positive path `cityId`; no body | `204 No Content` |
| `POST /api/admin/location/town` | JSON `CreateTownRequest`: `{ "cityId": 1, "townName": "Town name" }` | `201 Created` + `TownResponse` |
| `PUT /api/admin/location/town/{townId}` | Positive path `townId` + JSON `CreateTownRequest` | `200 OK` + `TownResponse` |
| `DELETE /api/admin/location/town/{townId}` | Positive path `townId`; no body | `204 No Content` |

City names are required and at most 100 characters. Town names are required and at most 100 characters; `cityId` is required, positive, and must identify an existing city. City names must be unique, as must town names within the same city.

## `/api/admin/properties`

All endpoints in this section require the `ADMIN` role.

| Endpoint | Request | Success response |
| --- | --- | --- |
| `GET /api/admin/properties` | Optional query `status`: `PENDING`, `APPROVED`, or `REJECTED` (default `APPROVED`); optional `page` (default `0`) | `200 OK` + `SliceResponse<PropertyCardResponse>` |
| `POST /api/admin/properties/{propertyId}/reject` | Positive path `propertyId` + JSON `RejectPropertyRequest`: `{ "rejectionReason": "Reason" }` | `200 OK`, empty body |
| `PATCH /api/admin/properties/{propertyId}/approve` | Positive path `propertyId`; no body | `200 OK`, empty body |

`rejectionReason` is required, nonblank, and at most 300 characters. Only a `PENDING` property can be approved or rejected.

## Response shapes

The following examples show field names and types, not real values. Timestamps use ISO-8601. DTOs annotated with `@JsonInclude(NON_NULL)` omit fields whose values are `null`.

| Type | Shape |
| --- | --- |
| `LoginResponse` | `{ "token": "JWT", "displayName": "string", "role": "ADMIN or PUBLISHER", "expiresAt": "ISO-8601", "userId": 1 }` |
| `CityResponse` | `{ "id": 1, "name": "string" }` |
| `TownResponse` | `{ "id": 1, "name": "string" }` |
| `DetailedTownResponse` | `{ "townId": 1, "townName": "string", "cityId": 1, "cityName": "string" }` |
| `MyProfileUserResponse` | `{ "id": 1, "displayName": "string", "phoneNumber": "string", "email": "string", "address": "string", "town": DetailedTownResponse, "profileImageUrl": "URL", "createdAt": "ISO-8601" }` |
| `PublicUserProfileResponse` | `{ "id": 1, "displayName": "string", "phoneNumber": "string", "town": DetailedTownResponse, "profileImageUrl": "URL", "createdAt": "ISO-8601" }` |
| `PropertyUserResponse` | `{ "id": 1, "displayName": "string", "profileImageUrl": "URL", "phoneNumber": "string" }` |
| `ImageResponse` | `{ "path": "string", "url": "URL" }` |
| `ImageUploadUrlsResponse` | `{ "uploadUrls": ["URL"], "imagePaths": ["path"] }`; arrays use matching order |
| `SliceResponse<T>` | `{ "content": [T], "hasNext": false, "page": 0 }` |

**`PropertyCardResponse`**

```json
{
  "id": 1,
  "title": "string",
  "propertyType": "APARTMENT",
  "listingType": "RENT",
  "postingStatus": "APPROVED",
  "rejectionReason": "string, or omitted",
  "rentPeriod": "HOURLY, DAILY, MONTHLY, YEARLY, or omitted",
  "price": 1000.00,
  "currency": "ILS",
  "areaSize": 120.50,
  "rooms": 3,
  "bathrooms": 2,
  "town": { "townId": 1, "townName": "string", "cityId": 1, "cityName": "string" },
  "isAvailable": true,
  "approvedAt": "ISO-8601, or omitted",
  "user": { "id": 1, "displayName": "string" },
  "coverImageUrl": "URL, or omitted"
}
```

`user` has the `PropertyUserResponse` shape. Moderation fields such as `postingStatus` and `rejectionReason` appear according to the viewing context. Null fields are omitted.

**`PropertyDetailsResponse`** includes `id`, `title`, `description`, `propertyType`, `listingType`, `price`, `currency`, `rentPeriod`, `areaSize`, `rooms`, `bathrooms`, `furnished`, `hasBalcony`, `address`, `latitude`, `longitude`, `town`, `isAvailable`, `postingStatus`, `rejectionReason`, `approvedAt`, `user`, and `images` (`ImageResponse[]`). It uses `images` rather than `coverImageUrl`. Null fields are omitted, and moderation fields depend on the viewer's permissions.

## Error handling

`GlobalExceptionHandler` and the security layer's `401`/`403` handlers return an `ApiErrorResponse` with this shape:

```json
{
  "timestamp": "2026-11-12T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error description",
  "path": "/api/admin/location/town",
  "fieldErrors": {
    "cityId": "Validation message for this field"
  }
}
```

`fieldErrors` is optional and omitted when `null`. DTO and method-parameter validation errors include the first message per field or parameter; `message` may remain a general validation description. Invalid path/query type conversion, missing required query parameters, and malformed JSON return `400`. Services can return `400`, `404`, or `409` depending on the failure. Missing authentication returns `401`; insufficient permission returns `403`. Framework errors not covered by these handlers may have a different response shape.

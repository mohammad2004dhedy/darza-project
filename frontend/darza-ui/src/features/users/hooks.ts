import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/auth'
import { getMyProfile, getMyProperties, getPublicProfile, getUserProperties } from './api'
import { isOwner } from './isOwner'

function validId(id: number): boolean {
  return Number.isSafeInteger(id) && id > 0
}

function retry(count: number, error: Error): boolean {
  return !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2
}

export function useProfilePage() {
  const { id: routeId } = useParams()
  const { userId } = useAuth()
  const id = Number(routeId)
  const notFound = !routeId || !/^[1-9]\d*$/.test(routeId) || !validId(id)
  return { id, notFound, isOwner: !notFound && isOwner(userId, id) }
}

export function useMyProfile() {
  const { userId, isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: ({ signal }) => getMyProfile(signal),
    enabled: isAuthenticated && userId !== null,
    staleTime: 60_000,
    retry,
  })
}

export function usePublicProfile(id: number) {
  return useQuery({
    queryKey: ['users', id, 'public'],
    queryFn: ({ signal }) => getPublicProfile(id, signal),
    enabled: validId(id),
    staleTime: 60_000,
    retry,
  })
}

export function useMyProperties() {
  const { userId, isAuthenticated } = useAuth()
  return useInfiniteQuery({
    queryKey: ['users', 'me', 'properties'],
    queryFn: ({ pageParam, signal }) => getMyProperties(pageParam, signal),
    enabled: isAuthenticated && userId !== null,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 60_000,
    retry,
  })
}

export function useUserProperties(id: number) {
  return useInfiniteQuery({
    queryKey: ['users', id, 'properties'],
    queryFn: ({ pageParam, signal }) => getUserProperties(id, pageParam, signal),
    enabled: validId(id),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 60_000,
    retry,
  })
}

export function isOwner(
  currentUserId: number | string | null | undefined,
  id: number | string,
): boolean {
  if (currentUserId === undefined || currentUserId === null) return false
  const currentId = Number(currentUserId)
  const profileId = Number(id)
  return Number.isSafeInteger(currentId) && currentId > 0 && currentId === profileId
}

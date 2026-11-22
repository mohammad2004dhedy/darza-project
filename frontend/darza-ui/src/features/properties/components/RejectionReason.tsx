export function RejectionReason({ reason }: { reason?: string }) {
  if (!reason) return null
  return <p className="line-clamp-2 text-sm text-danger">{reason}</p>
}
